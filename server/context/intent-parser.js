'use strict';

/**
 * Natural-language fallback for the hub.
 *
 * The security property that makes this shippable: the model never returns a
 * keystroke, a shell command, or a path. It returns an INDEX into a catalog
 * the host built from its own manifests. Anything that is not a verbatim
 * match for a catalog entry is discarded, so a hallucinated or
 * prompt-injected response is inert rather than dangerous.
 *
 * Node 22 has global fetch, so this needs no SDK.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const TIMEOUT_MS = Number(process.env.GROQ_TIMEOUT_MS || 6000);

const SYSTEM_PROMPT = [
  'You map a spoken remote-control request onto a numbered list of available actions.',
  'Reply with JSON only: {"picks":[<numbers>]} using indices from the list.',
  'A request may need several actions — return them in the order they should run.',
  'Use ONLY numbers that appear in the list. If nothing fits, return {"picks":[]}.',
  'Never invent actions, keystrokes, or commands.',
].join(' ');

function isConfigured() {
  return Boolean(process.env.GROQ_API_KEY);
}

/**
 * @param {string} text     What the user said.
 * @param {Array}  catalog  [{ deck, control, label }] from DeckEngine.
 * @returns {Promise<{ok:boolean, actions?:Array, reason?:string}>}
 */
async function parseIntent(text, catalog) {
  if (!isConfigured()) return { ok: false, reason: 'no-api-key' };
  if (typeof text !== 'string' || !text.trim()) return { ok: false, reason: 'empty' };
  if (!Array.isArray(catalog) || catalog.length === 0) return { ok: false, reason: 'empty-catalog' };

  // Cap the transcript so a long or adversarial utterance can't balloon the prompt.
  const utterance = text.trim().slice(0, 300);
  const menu = catalog.map((a, i) => `${i}. ${a.label}`).join('\n');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        temperature: 0,
        max_tokens: 120,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Available actions:\n${menu}\n\nRequest: "${utterance}"` },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, reason: `groq-${res.status}`, detail: body.slice(0, 200) };
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return { ok: false, reason: 'empty-response' };

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return { ok: false, reason: 'bad-json' };
    }

    // ── The whitelist gate ──────────────────────────────────────
    // Only integers that index the catalog survive. Everything else is
    // dropped, including any extra fields the model decided to add.
    const picks = Array.isArray(parsed?.picks) ? parsed.picks : [];
    const actions = picks
      .filter((n) => Number.isInteger(n) && n >= 0 && n < catalog.length)
      .slice(0, 4)
      .map((n) => ({ deck: catalog[n].deck, control: catalog[n].control, label: catalog[n].label }));

    if (actions.length === 0) return { ok: false, reason: 'no-match' };
    return { ok: true, actions };
  } catch (err) {
    if (err.name === 'AbortError') return { ok: false, reason: 'timeout' };
    return { ok: false, reason: 'network', detail: err.message };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { parseIntent, isConfigured, DEFAULT_MODEL };
