import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildApp } from './composition-root.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkgPath = path.resolve(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

export const VERSION = pkg.version || '1.0.0';

export async function main(argv = process.argv.slice(2)) {
  const command = argv[0] || 'dashboard';

  // Flag checks
  if (argv.includes('--version') || argv.includes('-v')) {
    console.log(VERSION);
    return 0;
  }

  if (argv.includes('--help') || argv.includes('-h') || command === 'help') {
    printHelp();
    return 0;
  }

  const app = buildApp();
  await app.init();

  const portArgIndex = argv.indexOf('--port');
  const port = portArgIndex !== -1 && argv[portArgIndex + 1]
    ? parseInt(argv[portArgIndex + 1], 10)
    : Number(process.env.PORT || 3000);

  const noWindow = argv.includes('--no-window');

  switch (command) {
    case 'run': {
      const status = await app.serverService.start(port);
      app.logger.info(`Server listening at http://${status.localIp}:${status.port}`);
      app.logger.info(`Loopback dashboard at http://127.0.0.1:${status.port}`);

      if (!noWindow) {
        await app.windowService.open(`http://127.0.0.1:${status.port}`);
      }
      return 0;
    }

    case 'dashboard':
    case 'window': {
      // Check if server is already running, if not start it
      try {
        const probe = await fetch(`http://127.0.0.1:${port}/ping`, { signal: AbortSignal.timeout(1000) });
        if (probe.ok) {
          app.logger.info(`Existing server detected at http://127.0.0.1:${port}. Launching window...`);
          await app.windowService.open(`http://127.0.0.1:${port}`);
          return 0;
        }
      } catch {}

      // Server not running: start server and open window
      const status = await app.serverService.start(port);
      app.logger.info(`Server started. Opening desktop window at http://127.0.0.1:${status.port}`);
      await app.windowService.open(`http://127.0.0.1:${status.port}`);
      return 0;
    }

    case 'doctor':
    case 'selftest': {
      const { ok } = await app.doctorService.runDoctor();
      return ok ? 0 : 1;
    }

    default:
      console.error(`Unknown command: "${command}"\n`);
      printHelp();
      return 1;
  }
}

function printHelp() {
  console.log(`
Remote Control v${VERSION} — Zero-lag desktop remote trackpad, keyboard & deck hub

USAGE:
  remote-control [command] [options]

COMMANDS:
  run          Start background server daemon (HTTP & WebSocket)
  dashboard    Open the native desktop dashboard window (default)
  window       Alias for dashboard
  doctor       Run diagnostic self-tests on dependencies, input & network
  help         Show this help screen

OPTIONS:
  --port <p>   Bind server to port <p> (default: 3000)
  --no-window  Do not launch the desktop window (for systemd / services)
  -v, --version Print application version and exit
  -h, --help    Show help message

EXAMPLES:
  remote-control run --no-window
  remote-control dashboard
  remote-control doctor
`);
}

// Direct invocation
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().then((code) => {
    if (typeof code === 'number' && code !== 0) process.exit(code);
  }).catch((err) => {
    console.error('Fatal:', err);
    process.exit(1);
  });
}
