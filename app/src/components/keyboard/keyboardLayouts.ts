import type { KeyDef } from './keyboard.types';

// ─── Helpers ─────────────────────────────────────────────────────
const ch = (label: string, code: string, shiftLabel?: string, w?: number): KeyDef => ({
  label,
  shiftLabel,
  code,
  type: 'character',
  width: w,
});

const sp = (label: string, code: string, w?: number): KeyDef => ({
  label,
  code,
  type: 'special',
  width: w,
});

const mod = (label: string, code: string, w?: number): KeyDef => ({
  label,
  code,
  type: 'modifier',
  width: w,
});

const fn = (label: string, code: string, w?: number): KeyDef => ({
  label,
  code,
  type: 'function',
  width: w,
});

const arrow = (label: string, code: string, w?: number): KeyDef => ({
  label,
  code,
  type: 'arrow',
  width: w,
});

const space: KeyDef = { label: '', code: 'Space', type: 'space', width: 5 };

// ─── LANDSCAPE LAYOUT (Full laptop-style) ────────────────────────
export const landscapeLayout: KeyDef[][] = [
  // Row 0: Function keys
  [
    fn('Esc', 'Escape'),
    fn('F1', 'F1'), fn('F2', 'F2'), fn('F3', 'F3'), fn('F4', 'F4'),
    fn('F5', 'F5'), fn('F6', 'F6'), fn('F7', 'F7'), fn('F8', 'F8'),
    fn('F9', 'F9'), fn('F10', 'F10'), fn('F11', 'F11'), fn('F12', 'F12'),
    sp('Del', 'Delete'),
  ],
  // Row 1: Number row
  [
    ch('`', 'Backquote', '~'),
    ch('1', 'Digit1', '!'), ch('2', 'Digit2', '@'), ch('3', 'Digit3', '#'),
    ch('4', 'Digit4', '$'), ch('5', 'Digit5', '%'), ch('6', 'Digit6', '^'),
    ch('7', 'Digit7', '&'), ch('8', 'Digit8', '*'), ch('9', 'Digit9', '('),
    ch('0', 'Digit0', ')'), ch('-', 'Minus', '_'), ch('=', 'Equal', '+'),
    sp('⌫', 'Backspace', 1.5),
  ],
  // Row 2: QWERTY
  [
    sp('Tab', 'Tab', 1.5),
    ch('q', 'KeyQ'), ch('w', 'KeyW'), ch('e', 'KeyE'), ch('r', 'KeyR'),
    ch('t', 'KeyT'), ch('y', 'KeyY'), ch('u', 'KeyU'), ch('i', 'KeyI'),
    ch('o', 'KeyO'), ch('p', 'KeyP'),
    ch('[', 'BracketLeft', '{'), ch(']', 'BracketRight', '}'),
    ch('\\', 'Backslash', '|'),
  ],
  // Row 3: Home row
  [
    mod('Caps', 'CapsLock', 1.7),
    ch('a', 'KeyA'), ch('s', 'KeyS'), ch('d', 'KeyD'), ch('f', 'KeyF'),
    ch('g', 'KeyG'), ch('h', 'KeyH'), ch('j', 'KeyJ'), ch('k', 'KeyK'),
    ch('l', 'KeyL'), ch(';', 'Semicolon', ':'), ch("'", 'Quote', '"'),
    sp('Enter', 'Enter', 1.7),
  ],
  // Row 4: Shift row
  [
    mod('⇧', 'ShiftLeft', 2.2),
    ch('z', 'KeyZ'), ch('x', 'KeyX'), ch('c', 'KeyC'), ch('v', 'KeyV'),
    ch('b', 'KeyB'), ch('n', 'KeyN'), ch('m', 'KeyM'),
    ch(',', 'Comma', '<'), ch('.', 'Period', '>'), ch('/', 'Slash', '?'),
    mod('⇧', 'ShiftRight', 2.2),
  ],
  // Row 5: Bottom row
  [
    mod('Ctrl', 'ControlLeft', 1.3),
    mod('Fn', 'Fn', 1),
    mod('Alt', 'AltLeft', 1.3),
    mod('⌘', 'MetaLeft', 1.3),
    { label: '', code: 'Space', type: 'space', width: 5 },
    mod('⌘', 'MetaRight', 1.3),
    mod('Alt', 'AltRight', 1.3),
    arrow('←', 'ArrowLeft'),
    arrow('↑', 'ArrowUp'),
    arrow('↓', 'ArrowDown'),
    arrow('→', 'ArrowRight'),
  ],
];

// ─── PORTRAIT LAYOUT (Compact, thumb-friendly) ─────────────────
export const portraitLayout: KeyDef[][] = [
  // Row 1: QWERTY
  [
    ch('q', 'KeyQ'), ch('w', 'KeyW'), ch('e', 'KeyE'), ch('r', 'KeyR'),
    ch('t', 'KeyT'), ch('y', 'KeyY'), ch('u', 'KeyU'), ch('i', 'KeyI'),
    ch('o', 'KeyO'), ch('p', 'KeyP'),
  ],
  // Row 2: Home
  [
    ch('a', 'KeyA'), ch('s', 'KeyS'), ch('d', 'KeyD'), ch('f', 'KeyF'),
    ch('g', 'KeyG'), ch('h', 'KeyH'), ch('j', 'KeyJ'), ch('k', 'KeyK'),
    ch('l', 'KeyL'),
  ],
  // Row 3: Shift row
  [
    mod('⇧', 'ShiftLeft', 1.5),
    ch('z', 'KeyZ'), ch('x', 'KeyX'), ch('c', 'KeyC'), ch('v', 'KeyV'),
    ch('b', 'KeyB'), ch('n', 'KeyN'), ch('m', 'KeyM'),
    sp('⌫', 'Backspace', 1.5),
  ],
  // Row 4: Bottom modifiers
  [
    mod('Ctrl', 'ControlLeft', 1.3),
    mod('Alt', 'AltLeft', 1.3),
    mod('⌘', 'MetaLeft', 1.3),
    { label: '', code: 'Space', type: 'space', width: 3.5 },
    sp('Enter', 'Enter', 1.5),
    sp('⋯', 'More', 1),
  ],
  // Row 5: Arrows + extras
  [
    arrow('←', 'ArrowLeft'),
    arrow('↓', 'ArrowDown'),
    arrow('↑', 'ArrowUp'),
    arrow('→', 'ArrowRight'),
  ],
];

// ─── Portrait "More" panel ──────────────────────────────────────
export const portraitMoreLayout: KeyDef[][] = [
  [
    fn('Esc', 'Escape'), fn('F1', 'F1'), fn('F2', 'F2'), fn('F3', 'F3'),
    fn('F4', 'F4'), fn('F5', 'F5'), fn('F6', 'F6'),
  ],
  [
    fn('F7', 'F7'), fn('F8', 'F8'), fn('F9', 'F9'), fn('F10', 'F10'),
    fn('F11', 'F11'), fn('F12', 'F12'),
  ],
  [
    ch('`', 'Backquote', '~'), ch('1', 'Digit1', '!'), ch('2', 'Digit2', '@'),
    ch('3', 'Digit3', '#'), ch('4', 'Digit4', '$'), ch('5', 'Digit5', '%'),
  ],
  [
    ch('6', 'Digit6', '^'), ch('7', 'Digit7', '&'), ch('8', 'Digit8', '*'),
    ch('9', 'Digit9', '('), ch('0', 'Digit0', ')'),
  ],
  [
    ch('-', 'Minus', '_'), ch('=', 'Equal', '+'),
    ch('[', 'BracketLeft', '{'), ch(']', 'BracketRight', '}'),
    ch('\\', 'Backslash', '|'), ch(';', 'Semicolon', ':'),
  ],
  [
    ch("'", 'Quote', '"'), ch(',', 'Comma', '<'),
    ch('.', 'Period', '>'), ch('/', 'Slash', '?'),
    sp('Tab', 'Tab'), sp('Del', 'Delete'),
  ],
  [
    sp('Home', 'Home'), sp('End', 'End'),
    sp('PgUp', 'PageUp'), sp('PgDn', 'PageDown'),
    sp('Ins', 'Insert'), mod('Caps', 'CapsLock'),
  ],
];
