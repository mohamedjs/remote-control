import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import { DeckService, FileDeckRepository, GroqIntentAdapter } from '../src/modules/decks/index.js';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

test('DeckService manifest resolution & whitelist enforcement', () => {
  let nut = null;
  try {
    nut = require('@nut-tree-fork/nut-js');
  } catch {}
  assert.ok(nut, 'nut.js required for resolution tests');

  const repo = new FileDeckRepository(path.join(ROOT_DIR, 'decks'));
  const groq = new GroqIntentAdapter();
  const service = new DeckService(repo, groq, nut);
  service.load();

  assert.ok(service.decks.size >= 8, `expected 8+ decks, got ${service.decks.size}`);

  let checked = 0;
  for (const deck of service.decks.values()) {
    for (const c of deck.controls) {
      const r = service.resolve(c.action);
      assert.ok(r, `${deck.id}/${c.id} did not resolve: ${JSON.stringify(c.action)}`);
      assert.ok(r.key !== undefined, `${deck.id}/${c.id} resolved to undefined key`);
      checked++;
    }
  }

  // Semantic modifiers differ by platform
  const isMac = process.platform === 'darwin';
  const spotifyNext = service.decks.get('spotify').controls.find((c) => c.id === 'next');
  const resolved = service.resolve(spotifyNext.action);
  assert.equal(resolved.mods.length, 1);
  assert.equal(resolved.mods[0], isMac ? nut.Key.LeftCmd : nut.Key.LeftControl);

  // Whitelist checks: nonexistent or hostile control IDs must not match
  for (const bad of [
    { deck: 'youtube', control: 'rm -rf /' },
    { deck: 'nope', control: 'playpause' },
    { deck: 'youtube', control: '__proto__' },
    { deck: 'youtube', control: 'constructor' },
  ]) {
    const deck = service.decks.get(bad.deck);
    const hit = deck && deck.controls.find((c) => c.id === bad.control);
    assert.ok(!hit, `whitelist leak: ${bad.deck}/${bad.control} matched a control`);
  }

  // Unknown modifiers and keys must refuse the whole action
  assert.equal(service.resolve({ mods: ['sudo'], key: 'a' }), null, 'unknown modifier must refuse');
  assert.equal(service.resolve({ key: 'NotAKey' }), null, 'unknown key must refuse');
  assert.equal(service.resolve({ media: 'selfdestruct' }), null, 'unknown media key must refuse');

  // Keystrokes must never leak to mobile client
  const publicList = service.list();
  const publicJson = JSON.stringify(publicList);
  assert.ok(!publicJson.includes('"action"'), 'public manifest leaked action');
  assert.ok(!publicJson.includes('"mods"'), 'public manifest leaked modifiers');
  assert.ok(publicJson.includes('"label"'), 'public manifest lost its labels');
});
