'use strict';
/** Boots the real server on a spare port and drives it over WebSocket. */
const { spawn } = require('node:child_process');
const WS = require('ws');
const assert = require('node:assert/strict');

const PORT = 3997;
const srv = spawn('node', ['index.js'], { env: { ...process.env, PORT }, stdio: 'pipe' });
let log = '';
srv.stdout.on('data', (d) => { log += d; });
srv.stderr.on('data', (d) => { log += d; });

let finished = false;
function done(code, why) {
  if (finished) return;
  finished = true;
  if (why) console.log(why);
  srv.kill('SIGKILL');
  setTimeout(() => process.exit(code), 60);
}
// An assertion thrown inside a socket handler must still reap the child,
// or the next run silently connects to a stale server with old code.
process.on('uncaughtException', (e) => done(1, `FAILED: ${e.message}`));
process.on('unhandledRejection', (e) => done(1, `FAILED: ${e && e.message}`));
const guard = setTimeout(() => done(1, `TIMEOUT\n${log}`), 20000);

/** Wait for the server to actually listen instead of guessing a delay. */
function waitForBoot(attempt = 0) {
  if (finished) return;
  if (attempt > 60) return done(1, `server never booted\n${log}`);
  const probe = new WS(`ws://127.0.0.1:${PORT}`);
  probe.on('open', () => { probe.close(); run(); });
  probe.on('error', () => setTimeout(() => waitForBoot(attempt + 1), 200));
}

function run() {
  const ws = new WS(`ws://127.0.0.1:${PORT}`);
  const acks = [];
  let welcome = null;

  ws.on('message', (raw) => {
    const m = JSON.parse(raw.toString());
    if (m.type === 'welcome') welcome = m;
    if (m.type === 'hub-ack') acks.push(m);
  });

  ws.on('error', (e) => done(1, `WS ERROR ${e.message}\n${log}`));

  ws.on('open', async () => {
    const send = (o) => ws.send(JSON.stringify(o));
    await new Promise((r) => setTimeout(r, 400));

    assert.ok(welcome, 'no welcome frame');
    assert.ok(Array.isArray(welcome.decks) && welcome.decks.length >= 8,
      `expected 8+ decks, got ${welcome.decks && welcome.decks.length}`);
    assert.equal(welcome.decks[0].id, 'system', 'system deck should sort first');
    assert.ok(welcome.decks[0].controls.length > 0, 'deck has no controls');

    // The phone must receive labels only — never keystrokes.
    const asText = JSON.stringify(welcome.decks);
    const leaked = ['"mods"', '"action"'].filter((k) => asText.includes(k));
    assert.equal(leaked.length, 0, `manifest leaked ${leaked.join(', ')}`);
    console.log(`  welcome: ${welcome.decks.length} decks, platform=${welcome.platform}, voice=${welcome.voiceEnabled}`);

    send({ type: 'hub', deck: 'system', control: 'volup' });
    // Hostile presses that must all be refused.
    send({ type: 'hub', deck: 'youtube', control: 'rm -rf /' });
    send({ type: 'hub', deck: '__proto__', control: 'playpause' });
    send({ type: 'hub', deck: 'youtube', control: '__proto__' });
    send({ type: 'hub', deck: 'nope', control: 'nope' });
    // Intent without an API key must fail cleanly, not crash.
    send({ type: 'intent', text: 'mute everything', deck: 'system' });
    // Pre-existing paths must still work.
    send({ type: 'key', key: 'Space' });
    send({ type: 'move', dx: 1, dy: 1 });

    await new Promise((r) => setTimeout(r, 900));

    const ok = acks.filter((a) => a.ok);
    const refused = acks.filter((a) => !a.ok);
    assert.equal(ok.length, 1, `expected 1 accepted press, got ${ok.length}`);
    assert.equal(ok[0].control, 'volup');
    assert.equal(refused.length, 4, `expected 4 refusals, got ${refused.length}`);
    for (const r of refused) {
      assert.ok(['unknown-deck', 'unknown-control'].includes(r.reason),
        `unexpected refusal reason: ${r.reason}`);
    }
    assert.ok(!log.includes('Error handling message'), 'server logged a handler error');

    console.log(`  presses: 1 accepted, ${refused.length} refused (${[...new Set(refused.map((r) => r.reason))].join(', ')})`);
    console.log('ok — hub e2e passed, whitelist held, existing paths intact');
    clearTimeout(guard);
    ws.close();
    done(0);
  });
}

waitForBoot();
