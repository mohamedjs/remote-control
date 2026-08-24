import type { ModifierName } from '../../types';

// ─── Key Types ──────────────────────────────────────────────────

export type KeyType = 'character' | 'modifier' | 'special' | 'function' | 'arrow' | 'space';

export interface KeyEvent {
  key: string;
  code: string;
  type: KeyType;
  /** Modifiers held (sticky) when this key was pressed. */
  modifiers: ModifierName[];
}

export type ModifierState = {
  shift: boolean;
  ctrl: boolean;
  alt: boolean;
  cmd: boolean;
  fn: boolean;
  capsLock: boolean;
};

export interface KeyDef {
  label: string;
  shiftLabel?: string;
  code: string;
  type: KeyType;
  /** Width relative to a standard key (1.0). e.g. 1.5, 2.0, etc. */
  width?: number;
}

export type KeyboardOrientation = 'portrait' | 'landscape';

export type ActiveTab = 'mouse' | 'keyboard' | 'shortcuts';
