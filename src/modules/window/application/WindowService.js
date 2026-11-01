export class WindowService {
  #port;
  #eventBus;
  #dataDir;

  /**
   * @param {import('../domain/WindowPort.js').WindowPort} port
   * @param {string} dataDir
   * @param {import('../../../kernel/events/EventBus.js').EventBus} [eventBus]
   */
  constructor(port, dataDir, eventBus = null) {
    this.#port = port;
    this.#dataDir = dataDir;
    this.#eventBus = eventBus;
  }

  async open(url) {
    const launched = await this.#port.openWindow(url, this.#dataDir);
    if (!launched) {
      this.#port.openFallbackBrowser(url);
    }
    this.#eventBus?.emit({ type: 'window.opened', url, native: launched });
  }

  openBrowser(url) {
    this.#port.openFallbackBrowser(url);
    this.#eventBus?.emit({ type: 'browser.opened', url });
  }
}
