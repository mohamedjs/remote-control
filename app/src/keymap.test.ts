/**
 * Every key the on-screen keyboard can produce must arrive at the server as
 * something it can actually press: a known code, or a single character.
 *
 *   node --experimental-strip-types src/keymap.test.ts
 */
import assert from 'node:assert/strict';
import { toActionMessage, SERVER_KEY_CODES } from './keymap.ts';
import {
  landscapeLayout,
  portraitLayout,
  portraitMoreLayout,
} from './components/keyboard/keyboardLayouts.ts';

const known = new Set<string>(SERVER_KEY_CODES);
const layouts = { landscapeLayout, portraitLayout, portraitMoreLayout };

let checked = 0;
for (const [name, layout] of Object.entries(layouts)) {
  for (const row of layout) {
    for (const keyDef of row) {
      if (keyDef.code === 'More') continue; // UI-only key, never transmitted

      // Unshifted, then shifted, since the keyboard resolves the char itself.
      for (const label of [keyDef.label, keyDef.shiftLabel ?? keyDef.label.toUpperCase()]) {
        const action = toActionMessage({
          key: keyDef.type === 'character' ? label : keyDef.label,
          code: keyDef.code,
          type: keyDef.type,
          modifiers: [],
        });

        if (keyDef.type === 'modifier') {
          assert.equal(action, null, `${name}: modifier ${keyDef.code} must not be sent alone`);
          continue;
        }

        assert.ok(action, `${name}: ${keyDef.code} produced no action`);
        assert.equal(action.type, 'key');
        const sent = (action as { key: string }).key;
        assert.ok(
          known.has(sent) || sent.length === 1,
          `${name}: ${keyDef.code} sends "${sent}" — not a server code and not a single character`,
        );
        checked++;
      }
    }
  }
}

// Space: its label is the empty string, so sending the label (the original
// bug) transmitted "" and the server did nothing at all.
assert.deepEqual(
  toActionMessage({ key: '', code: 'Space', type: 'space', modifiers: [] }),
  { type: 'key', key: 'Space' },
);

// Held modifiers ride along with the next real key.
const combo = toActionMessage({
  key: 'c', code: 'KeyC', type: 'character', modifiers: ['Control'],
});
assert.deepEqual(combo, { type: 'key', key: 'c', mods: ['Control'] });

console.log(`ok — ${checked} key mappings valid`);
