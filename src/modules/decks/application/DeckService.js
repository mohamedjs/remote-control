/**
 * Semantic modifiers:
 *   primary -> Cmd on macOS, Ctrl elsewhere
 *   meta    -> Ctrl on macOS, Super elsewhere
 */
const IS_MAC = process.platform === 'darwin';

export const MODIFIER_MAP = {
  primary: IS_MAC ? 'LeftCmd' : 'LeftControl',
  meta: IS_MAC ? 'LeftControl' : 'LeftSuper',
  shift: 'LeftShift',
  alt: 'LeftAlt',
  ctrl: 'LeftControl',
};

export const NAMED_KEYS = {
  space: 'Space', enter: 'Enter', tab: 'Tab', escape: 'Escape',
  backspace: 'Backspace', delete: 'Delete', insert: 'Insert',
  home: 'Home', end: 'End', pageup: 'PageUp', pagedown: 'PageDown',
  up: 'Up', down: 'Down', left: 'Left', right: 'Right',
  f1: 'F1', f2: 'F2', f3: 'F3', f4: 'F4', f5: 'F5', f6: 'F6',
  f7: 'F7', f8: 'F8', f9: 'F9', f10: 'F10', f11: 'F11', f12: 'F12',
};

export const MEDIA_KEYS = {
  playpause: 'AudioPlay', play: 'AudioPlay', pause: 'AudioPause',
  stop: 'AudioStop', next: 'AudioNext', prev: 'AudioPrev',
  mute: 'AudioMute', volup: 'AudioVolUp', voldown: 'AudioVolDown',
  rewind: 'AudioRewind', forward: 'AudioForward',
};

export const PUNCT_KEYS = {
  ',': 'Comma', '.': 'Period', '/': 'Slash', ';': 'Semicolon',
  "'": 'Quote', '[': 'LeftBracket', ']': 'RightBracket',
  '\\': 'Backslash', '`': 'Grave', '-': 'Minus', '=': 'Equal',
};

export class DeckService {
  #repository;
  #intentParser;
  #actionExecutor;
  #nut;
  #decks = new Map();
  #activeDeckId = 'system';
  #eventBus;

  /**
   * @param {import('../domain/DeckPort.js').DeckRepositoryPort} repository
   * @param {import('../domain/DeckPort.js').IntentParserPort} intentParser
   * @param {any} nut Module or object providing Key definitions and keyboard
   * @param {import('../../../kernel/events/EventBus.js').EventBus} [eventBus]
   */
  constructor(repository, intentParser, nut = null, eventBus = null) {
    this.#repository = repository;
    this.#intentParser = intentParser;
    this.#nut = nut;
    this.#eventBus = eventBus;
  }

  setNut(nut) {
    this.#nut = nut;
  }

  get decks() {
    return this.#decks;
  }

  get activeDeckId() {
    return this.#activeDeckId;
  }

  get isVoiceConfigured() {
    return Boolean(this.#intentParser?.isConfigured?.());
  }

  load() {
    this.#decks.clear();
    const rawDecks = this.#repository.loadAll() || [];

    for (const deck of rawDecks) {
      const problem = this.validate(deck);
      if (problem) continue;
      this.#decks.set(deck.id, deck);
    }

    this.#eventBus?.emit({
      type: 'decks.loaded',
      count: this.#decks.size,
      deckIds: [...this.#decks.keys()],
    });
  }

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
   * Safe public representation for mobile clients:
   * Action objects (keystrokes/modifiers) are strictly stripped out!
   */
  list() {
    return [...this.#decks.values()]
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
    if (this.#decks.has(deckId)) {
      this.#activeDeckId = deckId;
      this.#eventBus?.emit({ type: 'deck.selected', deckId });
      return true;
    }
    return false;
  }

  resolve(action) {
    if (!this.#nut || !this.#nut.Key) return null;
    const { Key } = this.#nut;

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
      if (modKey === undefined) return null; // unknown modifier — refuse whole action
      mods.push(modKey);
    }

    return { mods, key };
  }

  /**
   * Execute a control by ID. Enforces whitelist gate.
   */
  async press(deckId, controlId) {
    if (!this.#nut) return { ok: false, reason: 'input-unavailable' };

    const deck = this.#decks.get(deckId);
    if (!deck) return { ok: false, reason: 'unknown-deck' };

    const control = deck.controls.find((c) => c.id === controlId);
    if (!control) return { ok: false, reason: 'unknown-control' };

    const resolved = this.resolve(control.action);
    if (!resolved) return { ok: false, reason: 'unresolvable-action' };

    const { keyboard } = this.#nut;
    const { mods, key } = resolved;

    for (const m of mods) await keyboard.pressKey(m);
    try {
      await keyboard.pressKey(key);
      await keyboard.releaseKey(key);
    } finally {
      for (const m of [...mods].reverse()) await keyboard.releaseKey(m);
    }

    this.#eventBus?.emit({ type: 'control.pressed', deck: deckId, control: controlId });
    return { ok: true, deck: deckId, control: controlId };
  }

  actionCatalog(deckId = this.#activeDeckId) {
    const out = [];
    const push = (deck) => {
      if (!deck) return;
      for (const c of deck.controls) {
        out.push({ deck: deck.id, control: c.id, label: `${deck.name}: ${c.label}` });
      }
    };
    push(this.#decks.get(deckId));
    if (deckId !== 'system') push(this.#decks.get('system'));
    return out;
  }

  async parseAndExecuteIntent(text, deckId = this.#activeDeckId) {
    const catalog = this.actionCatalog(deckId);
    const result = await this.#intentParser.parseIntent(text, catalog);

    if (!result.ok) return result;

    for (const action of result.actions) {
      await this.press(action.deck, action.control);
    }

    return {
      ok: true,
      actions: result.actions.map((a) => a.label),
    };
  }
}
