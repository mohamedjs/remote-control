export type ThemeMode = 'dark' | 'light';

/** Modifier names shared with the server's key handler. */
export type ModifierName = 'Shift' | 'Control' | 'Alt' | 'Meta';

export interface ServerInfo {
  ip: string;
  port: number;
  name?: string;
  status: 'connected' | 'connecting' | 'disconnected';
}

export type ActionMessage = 
  | { type: 'move'; dx: number; dy: number }
  | { type: 'click'; button: 'left' | 'right' }
  | { type: 'scroll'; dy: number }
  | { type: 'key'; key: string; mods?: ModifierName[] };

// ─── Dynamic Context Hub ────────────────────────────────────────
/** A control on a deck. Rendered from the manifest the host sends. */
export interface DeckControl {
  id: string;
  label: string;
  glyph?: string;
  wide?: boolean;
  repeat?: boolean;
}

/**
 * Decks arrive from the host at runtime, so adding one is a JSON file on the
 * server — no app update. The phone never learns the keystrokes.
 */
export interface Deck {
  id: string;
  name: string;
  context: string;
  order?: number;
  controls: DeckControl[];
}
