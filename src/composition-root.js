import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Kernel
import { EventBus } from './kernel/events/EventBus.js';
import { createLogger } from './kernel/logging/logger.js';
import { getAppPaths } from './kernel/paths/paths.js';
import { ShutdownCoordinator } from './kernel/process/shutdown.js';

// Modules — strictly via public index.js facade
import { InputService, NutInputAdapter } from './modules/input/index.js';
import { DeckService, FileDeckRepository, GroqIntentAdapter } from './modules/decks/index.js';
import { ServerService, ExpressWsServer } from './modules/server/index.js';
import { WindowService, NativeChromiumLauncher } from './modules/window/index.js';
import { DoctorService, SystemDiagnosticAdapter } from './modules/diagnostics/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

/**
 * Single Composition Root:
 * Explicitly instantiates and wires all modules and adapters.
 */
export function buildApp(options = {}) {
  const logger = createLogger('RemoteControl');
  const eventBus = new EventBus();
  const paths = getAppPaths('remote-control');
  const shutdown = new ShutdownCoordinator(logger);

  // 1. Concrete Infrastructure Adapters
  const nutInputAdapter = new NutInputAdapter(logger);
  const deckDir = options.deckDir || path.join(ROOT_DIR, 'decks');
  const fileDeckRepo = new FileDeckRepository(deckDir);
  const groqAdapter = new GroqIntentAdapter();
  const windowLauncher = new NativeChromiumLauncher();

  // 2. Application Services
  const inputService = new InputService(nutInputAdapter, eventBus);
  const deckService = new DeckService(
    fileDeckRepo,
    groqAdapter,
    nutInputAdapter.nutInstance,
    eventBus
  );

  const expressWsServer = new ExpressWsServer(inputService, deckService, eventBus, logger);
  const serverService = new ServerService(expressWsServer, eventBus);
  const windowService = new WindowService(windowLauncher, paths.dataDir, eventBus);

  const diagnosticAdapter = new SystemDiagnosticAdapter(inputService, deckService);
  const doctorService = new DoctorService(diagnosticAdapter);

  // 3. Register Graceful Shutdown
  shutdown.register('Server', async () => {
    logger.info('Stopping HTTP & WebSocket server...');
    await serverService.stop();
  });
  shutdown.attachSignalHandlers();

  return {
    paths,
    logger,
    eventBus,
    shutdown,
    inputService,
    deckService,
    serverService,
    windowService,
    doctorService,
    async init() {
      await inputService.init();
      deckService.load();
    },
  };
}
