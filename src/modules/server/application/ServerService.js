export class ServerService {
  #port;
  #eventBus;
  #status = {
    running: false,
    host: '0.0.0.0',
    port: 3000,
    localIp: '127.0.0.1',
    connectedClients: 0,
  };

  /**
   * @param {import('../domain/ServerPort.js').ServerPort} port
   * @param {import('../../../kernel/events/EventBus.js').EventBus} [eventBus]
   */
  constructor(port, eventBus = null) {
    this.#port = port;
    this.#eventBus = eventBus;
  }

  async start(portNumber = 3000, host = '0.0.0.0') {
    const status = await this.#port.start({ port: portNumber, host });
    this.#status = { ...status, running: true };
    this.#eventBus?.emit({ type: 'server.started', status: this.#status });
    return this.#status;
  }

  async stop() {
    if (!this.#status.running) return;
    await this.#port.stop();
    this.#status.running = false;
    this.#eventBus?.emit({ type: 'server.stopped' });
  }

  broadcast(payload) {
    this.#port.broadcast(payload);
  }

  getStatus() {
    return this.#port.getStatus();
  }
}
