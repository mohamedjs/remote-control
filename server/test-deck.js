'use strict';
/** node test-deck.js — verifies deck loading, resolution and the whitelist gate. */
const assert = require('node:assert/strict');
const { DeckEngine } = require('./context/deck-engine');

let nut = null;
try { nut = require('@nut-tree-fork/nut-js'); } catch { /* resolution tests need it */ }
assert.ok(nut, 'nut.js required for these tests');

const e = new DeckEngine(nut);
assert.ok(e.decks.size >= 8, `expected 8+ decks, got ${e.decks.size}`);

// Every control in every manifest must resolve to real keys — this is what
// catches a typo in a deck file before a user presses a dead button.
let checked = 0;
for (const deck of e.decks.values()) {
  for (const c of deck.controls) {
    const r = e.resolve(c.action);
    assert.ok(r, `${deck.id}/${c.id} did not resolve: ${JSON.stringify(c.action)}`);
    assert.ok(r.key !== undefined, `${deck.id}/${c.id} resolved to undefined key`);
    checked++;
  }
}

// Semantic modifiers must differ by platform.
const mac = process.platform === 'darwin';
const spotifyNext = e.decks.get('spotify').controls.find((c) => c.id === 'next');
const resolved = e.resolve(spotifyNext.action);
assert.equal(resolved.mods.length, 1);
assert.equal(resolved.mods[0], mac ? nut.Key.LeftCmd : nut.Key.LeftControl);

// ── The whitelist gate ──────────────────────────────────────────
for (const bad of [
  { deck: 'youtube', control: 'rm -rf /' },
  { deck: 'nope', control: 'playpause' },
  { deck: 'youtube', control: '__proto__' },
  { deck: 'youtube', control: 'constructor' },
]) {
  const deck = e.decks.get(bad.deck);
  const hit = deck && deck.controls.find((c) => c.id === bad.control);
  assert.ok(!hit, `whitelist leak: ${bad.deck}/${bad.control} matched a control`);
}

// Unknown modifiers and keys must refuse the whole action, not partially run.
assert.equal(e.resolve({ mods: ['sudo'], key: 'a' }), null, 'unknown modifier must refuse');
assert.equal(e.resolve({ key: 'NotAKey' }), null, 'unknown key must refuse');
assert.equal(e.resolve({ media: 'selfdestruct' }), null, 'unknown media key must refuse');

// The intent catalog must only ever contain real controls.
// The client-facing list must never carry keystrokes.
const publicJson = JSON.stringify(e.list());
assert.ok(!publicJson.includes('"action"'), 'public manifest leaked action');
assert.ok(!publicJson.includes('"mods"'), 'public manifest leaked modifiers');
assert.ok(publicJson.includes('"label"'), 'public manifest lost its labels');

const catalog = e.actionCatalog('youtube');
assert.ok(catalog.length > 0);
for (const entry of catalog) {
  const deck = e.decks.get(entry.deck);
  assert.ok(deck && deck.controls.some((c) => c.id === entry.control),
    `catalog entry ${entry.deck}/${entry.control} is not a real control`);
}

console.log(`ok — ${e.decks.size} decks, ${checked} controls resolve, whitelist holds, catalog ${catalog.length} entries`);
