/**
 * Graceful reverse-order shutdown coordinator for registered cleanup hooks.
 */
export class ShutdownCoordinator {
  #hooks = [];
  #isShuttingDown = false;
  #logger;

  constructor(logger = console) {
    this.#logger = logger;
  }

  /**
   * Register a cleanup hook to run on shutdown.
   * Hooks run in LIFO (reverse) order.
   * @param {string} name
   * @param {() => Promise<void> | void} hook
   */
  register(name, hook) {
    this.#hooks.push({ name, hook });
  }

  /**
   * Attach process signal handlers (SIGINT, SIGTERM).
   */
  attachSignalHandlers() {
    const handleSignal = async (signal) => {
      this.#logger.info?.(`Received signal ${signal}, initiating graceful shutdown...`) ??
        console.log(`Received signal ${signal}, initiating graceful shutdown...`);
      await this.shutdown(0);
    };

    process.once('SIGINT', () => handleSignal('SIGINT'));
    process.once('SIGTERM', () => handleSignal('SIGTERM'));
  }

  /**
   * Execute all registered hooks in reverse order.
   * @param {number} exitCode
   */
  async shutdown(exitCode = 0) {
    if (this.#isShuttingDown) return;
    this.#isShuttingDown = true;

    const timeout = setTimeout(() => {
      console.error('[Shutdown] Forced exit due to shutdown timeout.');
      process.exit(exitCode || 1);
    }, 5000);
    timeout.unref();

    while (this.#hooks.length > 0) {
      const { name, hook } = this.#hooks.pop();
      try {
        await hook();
      } catch (err) {
        console.error(`[Shutdown] Cleanup hook "${name}" failed:`, err);
      }
    }

    clearTimeout(timeout);
    process.exit(exitCode);
  }
}
