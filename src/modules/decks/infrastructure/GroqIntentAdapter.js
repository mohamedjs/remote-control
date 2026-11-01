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

export class GroqIntentAdapter {
  #apiKey;
  #model;
  #timeoutMs;

  constructor(apiKey = process.env.GROQ_API_KEY, model = DEFAULT_MODEL, timeoutMs = TIMEOUT_MS) {
    this.#apiKey = apiKey;
    this.#model = model;
    this.#timeoutMs = timeoutMs;
  }

  isConfigured() {
    return Boolean(this.#apiKey);
  }

  async parseIntent(text, catalog) {
    if (!this.isConfigured()) return { ok: false, reason: 'no-api-key' };
    if (typeof text !== 'string' || !text.trim()) return { ok: false, reason: 'empty' };
    if (!Array.isArray(catalog) || catalog.length === 0) return { ok: false, reason: 'empty-catalog' };

    const utterance = text.trim().slice(0, 300);
    const menu = catalog.map((a, i) => `${i}. ${a.label}`).join('\n');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.#timeoutMs);

    try {
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.#apiKey}`,
        },
        body: JSON.stringify({
          model: this.#model,
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

      // Whitelist gate: Only integers that index the catalog survive.
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
}
