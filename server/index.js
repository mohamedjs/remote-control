const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const ip = require('ip');

const app = express();

app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// ─── Try to load nut.js (may fail on some systems) ─────────────
let mouse = null;
let keyboard = null;
let Key = null;
let Point = null;
let nutAvailable = false;

try {
  const nut = require('@nut-tree-fork/nut-js');
  mouse = nut.mouse;
  keyboard = nut.keyboard;
  Key = nut.Key;
  Point = nut.Point;
  nutAvailable = true;

  // Configure nut.js.
  // Both autoDelayMs values default high (mouse 100ms, keyboard 300ms) — they
  // exist to pace automation scripts, and are pure latency for a live remote.
  // Leaving the keyboard default in place costs ~301ms per keystroke and makes
  // fast typing queue up without bound.
  mouse.config.mouseSpeed = 2000;
  mouse.config.autoDelayMs = 0;
  keyboard.config.autoDelayMs = 0;

  console.log('✅ nut.js loaded — mouse and keyboard control available');
} catch (err) {
  console.warn('⚠️  nut.js could not be loaded (mouse/keyboard will be logged only)');
  console.warn('   Error:', err.message);
  console.warn('   The server will still work for connectivity testing.');
}

// Discovery endpoint — always works regardless of nut.js
app.get('/ping', (req, res) => {
  res.json({
    status: 'ok',
    device: 'laptop',
    hostname: require('os').hostname(),
    nutAvailable,
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', clients: wss.clients.size });
});

let currentPos = { x: 0, y: 0 };

async function initMouse() {
  if (!nutAvailable || !mouse) return;
  try {
    const pos = await mouse.getPosition();
    currentPos = { x: pos.x, y: pos.y };
    console.log(`🖱️  Initial mouse position: ${pos.x}, ${pos.y}`);
  } catch (err) {
    console.warn('Could not get initial mouse position:', err.message);
  }
}
initMouse();

// ─── Dynamic Context Hub ───────────────────────────────────────
const { DeckEngine } = require('./context/deck-engine');
const { parseIntent, isConfigured: groqConfigured } = require('./context/intent-parser');

const deckEngine = new DeckEngine(nutAvailable ? require('@nut-tree-fork/nut-js') : null);

/** Send a payload to every connected phone. */
function broadcast(payload) {
  const data = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(data);
  }
}

// ─── Key lookup ────────────────────────────────────────────────
// Keyed by DOM `code`, which is exactly what the app sends for every
// non-character key.
let NAMED_KEYS = {};
let MODIFIER_MAP = {};

if (nutAvailable && Key) {
  NAMED_KEYS = {
    Space: Key.Space,
    Backspace: Key.Backspace,
    Enter: Key.Enter,
    Tab: Key.Tab,
    Escape: Key.Escape,
    Delete: Key.Delete,
    Insert: Key.Insert,
    Home: Key.Home,
    End: Key.End,
    PageUp: Key.PageUp,
    PageDown: Key.PageDown,
    CapsLock: Key.CapsLock,
    ArrowUp: Key.Up,
    ArrowDown: Key.Down,
    ArrowLeft: Key.Left,
    ArrowRight: Key.Right,
    F1: Key.F1, F2: Key.F2, F3: Key.F3, F4: Key.F4,
    F5: Key.F5, F6: Key.F6, F7: Key.F7, F8: Key.F8,
    F9: Key.F9, F10: Key.F10, F11: Key.F11, F12: Key.F12,
  };

  MODIFIER_MAP = {
    Shift: Key.LeftShift,
    Control: Key.LeftControl,
    Alt: Key.LeftAlt,
    Meta: Key.LeftSuper,
  };
}

/**
 * Resolve an incoming key to a nut.js Key, or null when it should be typed
 * as a literal character instead.
 */
function resolveKey(name) {
  if (typeof name !== 'string' || name.length === 0) return null;
  if (Object.prototype.hasOwnProperty.call(NAMED_KEYS, name)) return NAMED_KEYS[name];
  if (!Key) return null;

  // Single characters need a real Key so they can combine with modifiers
  // (Ctrl+C etc.), which keyboard.type() cannot do.
  if (name.length === 1) {
    if (/[a-zA-Z]/.test(name)) return Key[name.toUpperCase()] ?? null;
    if (/[0-9]/.test(name)) return Key['Num' + name] ?? null;
  }
  return null;
}

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  // Small, frequent packets: never let Nagle coalesce them.
  req.socket.setNoDelay(true);
  console.log(`📱 Client connected from ${clientIp}`);

  // Send a welcome message to confirm connection
  ws.send(JSON.stringify({
    type: 'welcome',
    nutAvailable,
    platform: process.platform,
    voiceEnabled: groqConfigured(),
    decks: deckEngine.list(),
    activeDeck: deckEngine.activeDeckId,
  }));

  let queue = Promise.resolve();
  ws.on('message', (message) => {
    queue = queue.then(() => handleMessage(message)).catch(() => {});
  });

  async function handleMessage(message) {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'move') {
        currentPos.x += data.dx;
        currentPos.y += data.dy;
        // Clamp to reasonable bounds
        currentPos.x = Math.max(0, currentPos.x);
        currentPos.y = Math.max(0, currentPos.y);

        if (nutAvailable && mouse && Point) {
          await mouse.setPosition(new Point(Math.round(currentPos.x), Math.round(currentPos.y)));
        }
      }
      else if (data.type === 'click') {
        if (!nutAvailable || !mouse) return;
        if (data.button === 'left') {
          await mouse.leftClick();
        } else if (data.button === 'right') {
          await mouse.rightClick();
        }
      }
      else if (data.type === 'scroll') {
        if (!nutAvailable || !mouse) return;
        if (data.dy < 0) {
          await mouse.scrollUp(Math.abs(data.dy));
        } else {
          await mouse.scrollDown(Math.abs(data.dy));
        }
      }
      else if (data.type === 'key') {
        if (!nutAvailable || !keyboard || !Key) return;

        const target = resolveKey(data.key);
        const mods = (data.mods || [])
          .map((m) => MODIFIER_MAP[m])
          .filter(Boolean);

        if (target === null) {
          // Plain character with no modifiers held: type it directly so that
          // accented/symbol characters keep their exact value.
          if (mods.length === 0 && typeof data.key === 'string' && data.key.length === 1) {
            await keyboard.type(data.key);
          }
          return;
        }

        // Hold modifiers, tap the key, then release in reverse order.
        for (const m of mods) await keyboard.pressKey(m);
        try {
          await keyboard.pressKey(target);
          await keyboard.releaseKey(target);
        } finally {
          for (const m of [...mods].reverse()) await keyboard.releaseKey(m);
        }
      }
      else if (data.type === 'hub') {
        // The phone names a deck and a control — never a keystroke. Anything
        // outside the loaded manifests is unreachable from here by design.
        if (data.deck) deckEngine.setActive(data.deck);
        const result = await deckEngine.press(data.deck, data.control);
        if (!result.ok) {
          console.warn(`Hub rejected ${data.deck}/${data.control}: ${result.reason}`);
        }
        ws.send(JSON.stringify({ type: 'hub-ack', ...result }));
      }
      else if (data.type === 'intent') {
        const catalog = deckEngine.actionCatalog(data.deck || deckEngine.activeDeckId);
        const parsed = await parseIntent(data.text, catalog);

        if (!parsed.ok) {
          ws.send(JSON.stringify({ type: 'intent-result', ok: false, reason: parsed.reason }));
        } else {
          for (const action of parsed.actions) {
            await deckEngine.press(action.deck, action.control);
          }
          ws.send(JSON.stringify({
            type: 'intent-result',
            ok: true,
            actions: parsed.actions.map((a) => a.label),
          }));
        }
      }
    } catch (error) {
      // Only log real errors, not routine ones
      if (error.message && !error.message.includes('EPERM')) {
        console.error('Error handling message:', error.message);
      }
    }
  }

  ws.on('close', () => {
    console.log(`📱 Client disconnected (${clientIp})`);
  });

  ws.on('error', (err) => {
    console.error('WebSocket client error:', err.message);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  const localIp = ip.address();
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  🖥️  Remote Control Server');
  console.log('═══════════════════════════════════════════');
  console.log(`  HTTP:      http://${localIp}:${PORT}`);
  console.log(`  WebSocket: ws://${localIp}:${PORT}`);
  console.log(`  Ping:      http://${localIp}:${PORT}/ping`);
  console.log(`  nut.js:    ${nutAvailable ? '✅ Available' : '⚠️  Not available'}`);
  console.log(`  Decks:     ${deckEngine.decks.size} loaded`);
  console.log(`  Voice:     ${groqConfigured() ? '✅ Groq configured' : '○ set GROQ_API_KEY to enable'}`);
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('Waiting for phone to connect...');
});
