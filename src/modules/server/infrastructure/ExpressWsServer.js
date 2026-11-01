import http from 'node:http';
import os from 'node:os';
import express from 'express';
import cors from 'cors';
import ip from 'ip';
import { WebSocketServer, WebSocket } from 'ws';
import QRCode from 'qrcode';

export class ExpressWsServer {
  #app;
  #server;
  #wss;
  #inputService;
  #deckService;
  #eventBus;
  #logger;
  #status = {
    running: false,
    host: '0.0.0.0',
    port: 3000,
    localIp: '127.0.0.1',
    connectedClients: 0,
  };

  /**
   * @param {import('../../input/application/InputService.js').InputService} inputService
   * @param {import('../../decks/application/DeckService.js').DeckService} deckService
   * @param {import('../../../kernel/events/EventBus.js').EventBus} [eventBus]
   * @param {any} [logger]
   */
  constructor(inputService, deckService, eventBus = null, logger = console) {
    this.#inputService = inputService;
    this.#deckService = deckService;
    this.#eventBus = eventBus;
    this.#logger = logger;
    this.#setupExpress();
  }

  #setupExpress() {
    this.#app = express();
    this.#app.use(cors());
    this.#app.use(express.json());

    // Discovery endpoint (for phone auto-discovery)
    this.#app.get('/ping', (req, res) => {
      res.json({
        status: 'ok',
        device: 'laptop',
        hostname: os.hostname(),
        nutAvailable: this.#inputService.isAvailable,
      });
    });

    // Health check endpoint
    this.#app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        clients: this.#wss ? this.#wss.clients.size : 0,
      });
    });

    // Detailed API status
    this.#app.get('/api/status', (req, res) => {
      res.json(this.getStatus());
    });

    // QR code generation endpoint
    this.#app.get('/api/qr', async (req, res) => {
      try {
        const localIp = ip.address();
        const port = this.#status.port;
        const payload = JSON.stringify({ ip: localIp, port, ws: `ws://${localIp}:${port}` });
        const dataUrl = await QRCode.toDataURL(payload, { margin: 1, width: 256 });
        res.json({ ok: true, dataUrl, payload });
      } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
      }
    });

    // Desktop Dashboard Web UI
    this.#app.get('/', (req, res) => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(this.#renderDashboardHtml());
    });
  }

  #renderDashboardHtml() {
    const localIp = ip.address();
    const port = this.#status.port;
    const nutOk = this.#inputService.isAvailable;
    const voiceOk = this.#deckService.isVoiceConfigured;
    const decksCount = this.#deckService.decks.size;

    return `<!DOCTYPE html>
<html lang="en" dir="ltr" data-theme="auto">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Remote Control — Desktop Dashboard</title>
  <style>
    :root {
      --bg: #090d16;
      --surface: #111827;
      --card: #1f2937;
      --text: #f3f4f6;
      --muted: #9ca3af;
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.25);
      --green: #22c55e;
      --red: #ef4444;
      --line: #374151;
      --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    :root[data-theme="light"] {
      --bg: #f8fafc;
      --surface: #ffffff;
      --card: #f1f5f9;
      --text: #0f172a;
      --muted: #64748b;
      --accent: #0284c7;
      --accent-glow: rgba(2, 132, 199, 0.15);
      --green: #16a34a;
      --red: #dc2626;
      --line: #e2e8f0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font);
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      line-height: 1.5;
    }
    header {
      padding: 1.25rem 2rem;
      border-bottom: 1px solid var(--line);
      background: var(--surface);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 700;
      font-size: 1.25rem;
    }
    .badge {
      font-size: 0.75rem;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      background: rgba(34, 197, 94, 0.15);
      color: var(--green);
      font-weight: 600;
      border: 1px solid rgba(34, 197, 94, 0.3);
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
    .badge .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }
    .actions { display: flex; gap: 0.5rem; align-items: center; }
    button.btn {
      padding: 0.45rem 0.85rem;
      border-radius: 0.5rem;
      border: 1px solid var(--line);
      background: var(--surface);
      color: var(--text);
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
    }
    button.btn:hover { background: var(--card); border-color: var(--accent); }
    main {
      flex: 1;
      max-width: 1000px;
      width: 100%;
      margin: 0 auto;
      padding: 2rem 1.5rem;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    @media (max-width: 768px) { main { grid-template-columns: 1fr; } }
    .card {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .card h2 {
      font-size: 1.1rem;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-top: 1rem;
    }
    .stat-item {
      background: var(--card);
      border-radius: 0.75rem;
      padding: 1rem;
      border: 1px solid var(--line);
    }
    .stat-label { font-size: 0.8rem; color: var(--muted); }
    .stat-val { font-size: 1.35rem; font-weight: 700; margin-top: 0.25rem; color: var(--accent); }
    .qr-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 1rem;
    }
    .qr-box {
      background: #ffffff;
      padding: 1rem;
      border-radius: 0.75rem;
      display: inline-block;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    }
    .qr-box img { display: block; width: 180px; height: 180px; }
    .status-pill {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.6rem 0.85rem;
      border-radius: 0.5rem;
      background: var(--card);
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }
    .decks-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-top: 0.75rem;
    }
    .tag {
      background: var(--card);
      border: 1px solid var(--line);
      padding: 0.25rem 0.6rem;
      border-radius: 0.35rem;
      font-size: 0.75rem;
      font-family: monospace;
    }
    footer {
      padding: 1.25rem;
      text-align: center;
      color: var(--muted);
      font-size: 0.8rem;
      border-top: 1px solid var(--line);
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <span>📱 ⭤ 🖥️</span>
      <span id="title-text">Remote Control</span>
      <span class="badge"><span class="dot"></span><span id="live-status">Active</span></span>
    </div>
    <div class="actions">
      <button class="btn" id="lang-btn" onclick="toggleLang()">عربي</button>
      <button class="btn" id="theme-btn" onclick="toggleTheme()">🌓</button>
    </div>
  </header>

  <main>
    <section class="card">
      <h2 id="pair-heading">📲 Connect Mobile Device</h2>
      <div class="qr-container">
        <div class="qr-box">
          <img id="qr-img" src="" alt="Pairing QR Code">
        </div>
        <p style="font-size: 0.875rem; color: var(--muted);" id="pair-desc">
          Scan this QR code from the Expo Go app or Remote Control mobile companion to pair instantly.
        </p>
        <div class="status-pill" style="width: 100%;">
          <span>Local IP Address:</span>
          <strong style="color: var(--accent);">${localIp}</strong>
        </div>
        <div class="status-pill" style="width: 100%;">
          <span>Port:</span>
          <strong>${port}</strong>
        </div>
      </div>
    </section>

    <section class="card">
      <h2 id="sys-heading">📊 System & Service Status</h2>
      <div class="status-pill">
        <span>nut.js Mouse & Keyboard:</span>
        <strong style="color: ${nutOk ? 'var(--green)' : 'var(--muted)'};">${nutOk ? '✅ Active' : '○ Disabled'}</strong>
      </div>
      <div class="status-pill">
        <span>Groq Voice Intent:</span>
        <strong style="color: ${voiceOk ? 'var(--green)' : 'var(--muted)'};">${voiceOk ? '✅ Ready' : '○ Not configured'}</strong>
      </div>
      <div class="status-pill">
        <span>Connected Phones:</span>
        <strong id="client-count" style="color: var(--accent);">0</strong>
      </div>

      <div class="stats">
        <div class="stat-item">
          <div class="stat-label">Loaded Decks</div>
          <div class="stat-val">${decksCount}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Input Mode</div>
          <div class="stat-val" style="font-size: 1.1rem;">Native</div>
        </div>
      </div>

      <h2 style="margin-top: 1.5rem; font-size: 1rem;">Active Decks</h2>
      <div class="decks-tags" id="deck-list">
        <span class="tag">system</span>
        <span class="tag">youtube</span>
        <span class="tag">spotify</span>
        <span class="tag">vlc</span>
        <span class="tag">vscode</span>
        <span class="tag">netflix</span>
        <span class="tag">meet</span>
        <span class="tag">slides</span>
      </div>
    </section>
  </main>

  <footer>
    Remote Control Desktop Service · <a href="https://mohamedjs.github.io/remote-control/" target="_blank" style="color: var(--accent); text-decoration: none;">Landing Page</a> · <a href="https://github.com/mohamedjs/remote-control" target="_blank" style="color: var(--accent); text-decoration: none;">GitHub</a>
  </footer>

  <script>
    async function loadQr() {
      try {
        const res = await fetch('/api/qr');
        const data = await res.json();
        if (data.ok && data.dataUrl) {
          document.getElementById('qr-img').src = data.dataUrl;
        }
      } catch (err) {
        console.warn('Could not load QR code:', err);
      }
    }

    async function pollStatus() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        document.getElementById('client-count').textContent = data.connectedClients || 0;
      } catch {}
    }

    let isAr = false;
    function toggleLang() {
      isAr = !isAr;
      document.documentElement.lang = isAr ? 'ar' : 'en';
      document.documentElement.dir = isAr ? 'rtl' : 'ltr';
      document.getElementById('lang-btn').textContent = isAr ? 'English' : 'عربي';
      document.getElementById('title-text').textContent = isAr ? 'التحكم عن بعد — لوحة التحكم' : 'Remote Control';
      document.getElementById('pair-heading').textContent = isAr ? '📲 ربط الهاتف بالكمبيوتر' : '📲 Connect Mobile Device';
      document.getElementById('pair-desc').textContent = isAr ? 'امسح الباركود بتطبيق Expo Go أو تطبيق الموبايل للاتصال فوراً عبر الواي فاي.' : 'Scan this QR code from the Expo Go app or Remote Control mobile companion to pair instantly.';
      document.getElementById('sys-heading').textContent = isAr ? '📊 حالة النظام والخادم' : '📊 System & Service Status';
    }

    function toggleTheme() {
      const cur = document.documentElement.getAttribute('data-theme');
      const next = cur === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
    }

    loadQr();
    setInterval(pollStatus, 2500);
  </script>
</body>
</html>`;
  }

  async start(config) {
    const { port, host } = config;
    this.#server = http.createServer(this.#app);
    this.#wss = new WebSocketServer({ server: this.#server });

    this.#wss.on('connection', (ws, req) => {
      req.socket.setNoDelay(true);
      const clientIp = req.socket.remoteAddress;
      this.#status.connectedClients = this.#wss.clients.size;
      this.#logger.info?.(`📱 Phone connected from ${clientIp} (active: ${this.#status.connectedClients})`);
      this.#eventBus?.emit({ type: 'client.connected', clientIp, count: this.#status.connectedClients });

      // Send initial welcome message conforming to contract
      ws.send(JSON.stringify({
        type: 'welcome',
        nutAvailable: this.#inputService.isAvailable,
        platform: process.platform,
        voiceEnabled: this.#deckService.isVoiceConfigured,
        decks: this.#deckService.list(),
        activeDeck: this.#deckService.activeDeckId,
      }));

      let queue = Promise.resolve();
      ws.on('message', (message) => {
        queue = queue.then(() => this.#handleClientMessage(ws, message)).catch(() => {});
      });

      ws.on('close', () => {
        this.#status.connectedClients = this.#wss ? this.#wss.clients.size : 0;
        this.#logger.info?.(`📱 Phone disconnected (${clientIp})`);
        this.#eventBus?.emit({ type: 'client.disconnected', clientIp, count: this.#status.connectedClients });
      });

      ws.on('error', (err) => {
        this.#logger.warn?.(`WebSocket error on ${clientIp}:`, err.message);
      });
    });

    return new Promise((resolve, reject) => {
      this.#server.listen(port, host, () => {
        const localIp = ip.address();
        this.#status = {
          running: true,
          host,
          port,
          localIp,
          connectedClients: 0,
        };
        resolve(this.#status);
      });
      this.#server.on('error', (err) => reject(err));
    });
  }

  async #handleClientMessage(ws, raw) {
    try {
      const data = JSON.parse(raw.toString());

      if (data.type === 'move') {
        await this.#inputService.move(data.dx, data.dy);
      } else if (data.type === 'click') {
        await this.#inputService.click(data.button || 'left');
      } else if (data.type === 'scroll') {
        await this.#inputService.scroll(data.dy);
      } else if (data.type === 'key') {
        await this.#inputService.handleKey(data.key, data.mods || []);
      } else if (data.type === 'hub') {
        if (data.deck) this.#deckService.setActive(data.deck);
        const result = await this.#deckService.press(data.deck, data.control);
        if (!result.ok) {
          this.#logger.warn?.(`Hub rejected ${data.deck}/${data.control}: ${result.reason}`);
        }
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'hub-ack', ...result }));
        }
      } else if (data.type === 'intent') {
        const res = await this.#deckService.parseAndExecuteIntent(data.text, data.deck);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'intent-result', ...res }));
        }
      }
    } catch (err) {
      if (err.message && !err.message.includes('EPERM')) {
        this.#logger.error?.('Error handling socket message:', err.message);
      }
    }
  }

  async stop() {
    return new Promise((resolve) => {
      if (this.#wss) {
        for (const client of this.#wss.clients) {
          try { client.close(); } catch {}
        }
        this.#wss.close();
      }
      if (this.#server) {
        this.#server.close(() => {
          this.#status.running = false;
          resolve();
        });
      } else {
        this.#status.running = false;
        resolve();
      }
    });
  }

  broadcast(payload) {
    if (!this.#wss) return;
    const msg = JSON.stringify(payload);
    for (const client of this.#wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    }
  }

  getStatus() {
    return {
      ...this.#status,
      connectedClients: this.#wss ? this.#wss.clients.size : 0,
      nutAvailable: this.#inputService.isAvailable,
      voiceEnabled: this.#deckService.isVoiceConfigured,
      decksCount: this.#deckService.decks.size,
    };
  }
}
