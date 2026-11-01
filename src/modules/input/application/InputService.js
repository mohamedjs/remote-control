import { NamedKey } from '../domain/InputPort.js';

/**
 * Use case service orchestrating mouse & keyboard actions through the InputPort.
 * Enforces boundary clamping, modifier sequencing, and input availability gates.
 */
export class InputService {
  #port;
  #currentPos = { x: 0, y: 0 };
  #eventBus;

  /**
   * @param {import('../domain/InputPort.js').InputPort} port
   * @param {import('../../../kernel/events/EventBus.js').EventBus} [eventBus]
   */
  constructor(port, eventBus = null) {
    this.#port = port;
    this.#eventBus = eventBus;
  }

  async init() {
    if (!this.#port.isAvailable()) return;
    try {
      const pos = await this.#port.getPosition();
      this.#currentPos = { x: pos.x, y: pos.y };
      this.#eventBus?.emit({ type: 'input.initialized', pos: this.#currentPos });
    } catch {
      // Fallback to default
    }
  }

  get isAvailable() {
    return this.#port.isAvailable();
  }

  get currentPosition() {
    return { ...this.#currentPos };
  }

  async move(dx, dy) {
    this.#currentPos.x = Math.max(0, this.#currentPos.x + dx);
    this.#currentPos.y = Math.max(0, this.#currentPos.y + dy);

    if (this.#port.isAvailable()) {
      await this.#port.setPosition(Math.round(this.#currentPos.x), Math.round(this.#currentPos.y));
    }
  }

  async click(button = 'left') {
    if (!this.#port.isAvailable()) return;
    await this.#port.click(button);
  }

  async scroll(dy) {
    if (!this.#port.isAvailable()) return;
    const direction = dy < 0 ? 'up' : 'down';
    await this.#port.scroll(Math.abs(dy), direction);
  }

  async handleKey(keyName, mods = []) {
    if (!this.#port.isAvailable()) return;

    if (mods.length === 0 && typeof keyName === 'string' && keyName.length === 1 && !NamedKey[keyName]) {
      // Direct text typing
      await this.#port.typeText(keyName);
      return;
    }

    await this.#port.tapKey(keyName, mods);
  }
}
