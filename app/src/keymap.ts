import type { ActionMessage } from './types';
import type { KeyEvent } from './components/keyboard/keyboard.types';

/**
 * Keys the server resolves through its `code`-keyed lookup table.
 * Anything not listed here must be a single printable character,
 * which the server types directly.
 */
export const SERVER_KEY_CODES = [
  'Space', 'Backspace', 'Enter', 'Tab', 'Escape', 'Delete', 'Insert',
  'Home', 'End', 'PageUp', 'PageDown', 'CapsLock',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
] as const;

/**
 * Turn a keyboard event into the message the server understands.
 *
 * Character keys travel as the resolved character ("a", "A", "!"); every other
 * key travels as its DOM `code`, which is what the server's table is keyed by.
 * Modifier presses themselves are sticky UI state and are never sent on their
 * own — they ride along on the next real key as `mods`.
 */
export function toActionMessage(event: KeyEvent): ActionMessage | null {
  if (event.type === 'modifier') return null;

  const key = event.type === 'character' ? event.key : event.code;
  if (!key) return null;

  return event.modifiers && event.modifiers.length > 0
    ? { type: 'key', key, mods: event.modifiers }
    : { type: 'key', key };
}
