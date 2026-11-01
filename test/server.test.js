import test from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import { buildApp } from '../src/composition-root.js';

test('Server WebSocket connection, welcome handshake, and control execution', async () => {
  const TEST_PORT = 3988;
  const app = buildApp();
  await app.init();
  const status = await app.serverService.start(TEST_PORT);
  assert.equal(status.port, TEST_PORT);

  const ws = new WebSocket(`ws://127.0.0.1:${TEST_PORT}`);
  const acks = [];
  let welcome = null;

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'welcome') welcome = msg;
      if (msg.type === 'hub-ack') acks.push(msg);
    } catch {}
  });

  await new Promise((resolve, reject) => {
    ws.on('error', reject);
    ws.on('open', resolve);
  });

  // Give socket handshake and welcome frame time to arrive
  for (let i = 0; i < 20 && !welcome; i++) {
    await new Promise((r) => setTimeout(r, 50));
  }

  assert.ok(welcome, 'Expected welcome frame');
  assert.ok(welcome.decks.length >= 8, `Expected >= 8 decks, got ${welcome.decks.length}`);
  assert.equal(welcome.decks[0].id, 'system');

  // Verify action/mods are not exposed to client
  const text = JSON.stringify(welcome.decks);
  assert.ok(!text.includes('"mods"'), 'welcome frame leaked mods');
  assert.ok(!text.includes('"action"'), 'welcome frame leaked action');

  // Send legitimate hub press
  ws.send(JSON.stringify({ type: 'hub', deck: 'system', control: 'volup' }));

  // Send hostile presses that must be rejected
  ws.send(JSON.stringify({ type: 'hub', deck: 'youtube', control: 'rm -rf /' }));
  ws.send(JSON.stringify({ type: 'hub', deck: '__proto__', control: 'playpause' }));
  ws.send(JSON.stringify({ type: 'hub', deck: 'youtube', control: '__proto__' }));
  ws.send(JSON.stringify({ type: 'hub', deck: 'nope', control: 'nope' }));

  // Send input events
  ws.send(JSON.stringify({ type: 'key', key: 'Space' }));
  ws.send(JSON.stringify({ type: 'move', dx: 1, dy: 1 }));

  // Wait for hub acks
  for (let i = 0; i < 30 && acks.length < 5; i++) {
    await new Promise((r) => setTimeout(r, 50));
  }

  const ok = acks.filter((a) => a.ok);
  const refused = acks.filter((a) => !a.ok);
  assert.equal(ok.length, 1, `Expected 1 accepted press, got ${ok.length}`);
  assert.equal(ok[0].control, 'volup');
  assert.equal(refused.length, 4, `Expected 4 refusals, got ${refused.length}`);

  // Test HTTP endpoints
  const pingRes = await fetch(`http://127.0.0.1:${TEST_PORT}/ping`);
  assert.equal(pingRes.status, 200);
  const pingData = await pingRes.json();
  assert.equal(pingData.status, 'ok');

  const healthRes = await fetch(`http://127.0.0.1:${TEST_PORT}/health`);
  assert.equal(healthRes.status, 200);
  const healthData = await healthRes.json();
  assert.equal(healthData.status, 'ok');

  ws.close();
  await app.serverService.stop();
});
