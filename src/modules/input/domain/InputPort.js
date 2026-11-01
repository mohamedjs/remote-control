/**
 * Domain port interface for low-level desktop mouse and keyboard control.
 * Pure interface and constants — zero I/O.
 */

export const Button = {
  LEFT: 'left',
  RIGHT: 'right',
  MIDDLE: 'middle',
};

/**
 * Standard named keys recognized by the domain.
 */
export const NamedKey = {
  Space: 'Space',
  Backspace: 'Backspace',
  Enter: 'Enter',
  Tab: 'Tab',
  Escape: 'Escape',
  Delete: 'Delete',
  Insert: 'Insert',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
  CapsLock: 'CapsLock',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  F1: 'F1', F2: 'F2', F3: 'F3', F4: 'F4',
  F5: 'F5', F6: 'F6', F7: 'F7', F8: 'F8',
  F9: 'F9', F10: 'F10', F11: 'F11', F12: 'F12',
};

export const Modifier = {
  Shift: 'Shift',
  Control: 'Control',
  Alt: 'Alt',
  Meta: 'Meta',
};

/**
 * @typedef {Object} InputPort
 * @property {() => boolean} isAvailable
 * @property {() => Promise<{ x: number, y: number }>} getPosition
 * @property {(x: number, y: number) => Promise<void>} setPosition
 * @property {(btn: string) => Promise<void>} click
 * @property {(amount: number, direction: 'up' | 'down') => Promise<void>} scroll
 * @property {(key: any, mods: any[]) => Promise<void>} tapKey
 * @property {(text: string) => Promise<void>} typeText
 */
