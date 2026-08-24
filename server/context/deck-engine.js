'use strict';

const fs = require('fs');
const path = require('path');

const DECK_DIR = path.join(__dirname, '..', 'decks');

/**
 * Semantic modifiers. A deck says "primary" and the host decides what that
 * means, so one manifest is correct on every OS without a branch in the deck.
 *
 *   primary  Cmd on macOS, Ctrl elsewhere   — save, copy, new tab
 *   meta     Ctrl on macOS, Super elsewhere — window management
 */
const IS_MAC = process.platform === 'darwin';

const MODIFIER_MAP = {
  primary: IS_MAC ? 'LeftCmd' : 'LeftControl',
  meta: IS_MAC ? 'LeftControl' : 'LeftSuper',
  shift: 'LeftShift',
  alt: IS_MAC ? 'LeftAlt' : 'LeftAlt',
  ctrl: 'LeftControl',
};

/** Named keys a manifest may reference, mapped to nut.js Key members. */
const NAMED_KEYS = {
  space: 'Space', enter: 'Enter', tab: 'Tab', escape: 'Escape',
  backspace: 'Backspace', delete: 'Delete', insert: 'Insert',
  home: 'Home', end: 'End', pageup: 'PageUp', pagedown: 'PageDown',
  up: 'Up', down: 'Down', left: 'Left', right: 'Right',
  f1: 'F1', f2: 'F2', f3: 'F3', f4: 'F4', f5: 'F5', f6: 'F6',
  f7: 'F7', f8: 'F8', f9: 'F9', f10: 'F10', f11: 'F11', f12: 'F12',
};

/** Universal HID media keys — identical on every platform. */
const MEDIA_KEYS = {
  playpause: 'AudioPlay', play: 'AudioPlay', pause: 'AudioPause',
  stop: 'AudioStop', next: 'AudioNext', prev: 'AudioPrev',
  mute: 'AudioMute', volup: 'AudioVolUp', voldown: 'AudioVolDown',
  rewind: 'AudioRewind', forward: 'AudioForward',
};

/** Punctuation a manifest may reference by literal character. */
const PUNCT_KEYS = {
  ',': 'Comma', '.': 'Period', '/': 'Slash', ';': 'Semicolon',
  "'": 'Quote', '[': 'LeftBracket', ']': 'RightBracket',
  '\\': 'Backslash', '`': 'Grave', '-': 'Minus', '=': 'Equal',
};

class DeckEngine {
  /**
   * @param {object} nut  The loaded nut.js module, or null when unavailable.
   */
  constructor(nut) {
    this.nut = nut;
    this.decks = new Map();
    this.activeDeckId = 'system';
    this.load();
  }

  // ─── Manifests ────────────────────────────────────────────────
  load() {
    this.decks.clear();
    let files = [];
    try {
      files = fs.readdirSync(DECK_DIR).filter((f) => f.endsWith('.json'));
    } catch (err) {
      console.warn(`⚠️  No deck directory at ${DECK_DIR}: ${err.message}`);
      return;
    }

    for (const file of files) {
      try {
        const deck = JSON.parse(fs.readFileSync(path.join(DECK_DIR, file), 'utf8'));
        const problem = this.validate(deck);
        if (problem) {
          console.warn(`⚠️  Skipping deck ${file}: ${problem}`);
          continue;
        }
        this.decks.set(deck.id, deck);
      } catch (err) {
        console.warn(`⚠️  Skipping deck ${file}: ${err.message}`);
      }
    }

    console.log(`🎛️  Loaded ${this.decks.size} decks: ${[...this.decks.keys()].join(', ')}`);
  }

  /** Reject a malformed manifest at load time rather than on first press. */
  validate(deck) {
    if (!deck || typeof deck.id !== 'string') return 'missing id';
    if (!Array.isArray(deck.controls) || deck.controls.length === 0) return 'no controls';
    for (const c of deck.controls) {
      if (typeof c.id !== 'string') return 'control without id';
      if (!c.action || typeof c.action !== 'object') return `control ${c.id} has no action`;
      if (!c.action.key && !c.action.media) return `control ${c.id} action has neither key nor media`;
    }
    return null;
  }

  /**
   * Manifests as sent to the phone — with `action` stripped.
   *
   * The client gets labels and glyphs so it can render the deck, and nothing
   * else. Keystrokes never leave the host, so a compromised or modified client
   * still cannot do more than name a control that already exists here.
   */
  list() {
    return [...this.decks.values()]
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
      .map((deck) => ({
        id: deck.id,
        name: deck.name,
        context: deck.context,
        order: deck.order,
        controls: deck.controls.map((c) => ({
          id: c.id,
          label: c.label,
          glyph: c.glyph,
          wide: c.wide,
          repeat: c.repeat,
        })),
      }));
  }

  setActive(deckId) {
    if (this.decks.has(deckId)) {
      this.activeDeckId = deckId;
      return true;
    }
    return false;
  }

  // ─── Resolution ───────────────────────────────────────────────
  /**
   * Turn a manifest action into concrete nut.js keys.
   * Returns null when anything is unrecognized — callers must treat null as
   * "do nothing", never as "pass it through".
   */
  resolve(action) {
    const { Key } = this.nut;

    if (action.media) {
      const name = MEDIA_KEYS[String(action.media).toLowerCase()];
      const key = name && Key[name];
      return key === undefined ? null : { mods: [], key };
    }

    const raw = String(action.key);
    const lower = raw.toLowerCase();
    let name = NAMED_KEYS[lower] || PUNCT_KEYS[raw];

    if (!name) {
      if (/^[a-z]$/.test(lower)) name = lower.toUpperCase();
      else if (/^[0-9]$/.test(raw)) name = `Num${raw}`;
    }
    const key = name && Key[name];
    if (key === undefined) return null;

    const mods = [];
    for (const m of action.mods || []) {
      const modName = MODIFIER_MAP[String(m).toLowerCase()];
      const modKey = modName && Key[modName];
      if (modKey === undefined) return null; // unknown modifier — refuse the whole action
      mods.push(modKey);
    }

    return { mods, key };
  }

  // ─── Execution ────────────────────────────────────────────────
  /**
   * Execute a control by id. This is the ONLY way the hub can press keys:
   * the phone names a deck and a control, never a keystroke, so nothing
   * outside these manifests is reachable no matter what a client sends.
   */
  async press(deckId, controlId) {
    if (!this.nut) return { ok: false, reason: 'input-unavailable' };

    const deck = this.decks.get(deckId);
    if (!deck) return { ok: false, reason: 'unknown-deck' };

    const control = deck.controls.find((c) => c.id === controlId);
    if (!control) return { ok: false, reason: 'unknown-control' };

    const resolved = this.resolve(control.action);
    if (!resolved) return { ok: false, reason: 'unresolvable-action' };

    const { keyboard } = this.nut;
    const { mods, key } = resolved;

    for (const m of mods) await keyboard.pressKey(m);
    try {
      await keyboard.pressKey(key);
      await keyboard.releaseKey(key);
    } finally {
      for (const m of [...mods].reverse()) await keyboard.releaseKey(m);
    }

    return { ok: true, deck: deckId, control: controlId };
  }

  /** Every control id the intent parser is allowed to choose from. */
  actionCatalog(deckId) {
    const out = [];
    const push = (deck) => {
      if (!deck) return;
      for (const c of deck.controls) {
        out.push({ deck: deck.id, control: c.id, label: `${deck.name}: ${c.label}` });
      }
    };
    push(this.decks.get(deckId));
    if (deckId !== 'system') push(this.decks.get('system'));
    return out;
  }
}

module.exports = { DeckEngine, MODIFIER_MAP, MEDIA_KEYS };
