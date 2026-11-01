import net from 'node:net';
import ip from 'ip';

export class SystemDiagnosticAdapter {
  #inputService;
  #deckService;

  /**
   * @param {import('../../input/application/InputService.js').InputService} inputService
   * @param {import('../../decks/application/DeckService.js').DeckService} deckService
   */
  constructor(inputService, deckService) {
    this.#inputService = inputService;
    this.#deckService = deckService;
  }

  async runChecks() {
    const checks = [];

    // 1. Node.js version
    const nodeMajor = parseInt(process.versions.node.split('.')[0], 10);
    if (nodeMajor >= 20) {
      checks.push({
        name: 'Node.js Runtime',
        status: 'pass',
        message: `Node.js v${process.versions.node} detected (>= v20 required)`,
      });
    } else {
      checks.push({
        name: 'Node.js Runtime',
        status: 'fail',
        message: `Node.js v${process.versions.node} is below required v20+`,
        fix: 'Upgrade Node.js to v20 or v22 (e.g. nvm install 22)',
      });
    }

    // 2. Input simulation (nut.js)
    if (this.#inputService.isAvailable) {
      checks.push({
        name: 'Input Simulation (nut.js)',
        status: 'pass',
        message: 'Native mouse and keyboard simulation drivers available',
      });
    } else {
      checks.push({
        name: 'Input Simulation (nut.js)',
        status: 'warn',
        message: 'Native nut.js binaries not loaded. Operates in log-only mode.',
        fix: 'Ensure build tools & libXtst are installed (sudo apt install -y build-essential libxtst-dev libpng-dev)',
      });
    }

    // 3. Display Server
    if (process.platform === 'linux') {
      const display = process.env.DISPLAY || process.env.WAYLAND_DISPLAY;
      if (display) {
        checks.push({
          name: 'Display Server',
          status: 'pass',
          message: `Active display detected (${display})`,
        });
      } else {
        checks.push({
          name: 'Display Server',
          status: 'warn',
          message: 'No graphical display server found in environment ($DISPLAY is empty)',
          fix: 'Run inside an active desktop session or export DISPLAY=:0',
        });
      }
    } else {
      checks.push({
        name: 'Display Server',
        status: 'pass',
        message: `OS graphical environment detected (${process.platform})`,
      });
    }

    // 4. Local Network IP
    try {
      const localIp = ip.address();
      checks.push({
        name: 'Network Interface',
        status: 'pass',
        message: `Local IPv4 address resolved: ${localIp}`,
      });
    } catch {
      checks.push({
        name: 'Network Interface',
        status: 'warn',
        message: 'Could not determine local network IP',
        fix: 'Check your Wi-Fi or LAN connection',
      });
    }

    // 5. Port 3000 Availability
    const portFree = await this.#isPortAvailable(3000);
    if (portFree) {
      checks.push({
        name: 'Default Port (3000)',
        status: 'pass',
        message: 'Port 3000 is open and ready to bind',
      });
    } else {
      checks.push({
        name: 'Default Port (3000)',
        status: 'warn',
        message: 'Port 3000 is currently occupied (a service or background daemon may be running)',
        fix: 'Use a different port via --port <number> or stop the existing process',
      });
    }

    // 6. Decks Loaded
    const deckCount = this.#deckService.decks.size;
    if (deckCount > 0) {
      checks.push({
        name: 'Context Decks',
        status: 'pass',
        message: `${deckCount} deck manifests loaded (${[...this.#deckService.decks.keys()].join(', ')})`,
      });
    } else {
      checks.push({
        name: 'Context Decks',
        status: 'warn',
        message: 'No deck manifests loaded from decks/ directory',
        fix: 'Add JSON deck manifests to the decks/ directory',
      });
    }

    // 7. Groq Voice Intent
    if (this.#deckService.isVoiceConfigured) {
      checks.push({
        name: 'Groq Voice Intent',
        status: 'pass',
        message: 'GROQ_API_KEY detected — AI voice intents enabled',
      });
    } else {
      checks.push({
        name: 'Groq Voice Intent',
        status: 'warn',
        message: 'GROQ_API_KEY environment variable not set',
        fix: 'Export GROQ_API_KEY="gsk_..." to enable voice command processing',
      });
    }

    return checks;
  }

  async #isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once('error', () => resolve(false));
      server.once('listening', () => {
        server.close(() => resolve(true));
      });
      server.listen(port, '127.0.0.1');
    });
  }
}
