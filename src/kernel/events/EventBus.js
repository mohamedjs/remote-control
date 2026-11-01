/**
 * Typed synchronous in-process event bus.
 * Emits past-tense facts ('device.connected', 'settings.changed'), never commands.
 */
export class EventBus {
  #handlers = new Map();

  /**
   * Register a subscriber for a specific event type.
   * @param {string} type
   * @param {(event: any) => void} handler
   * @returns {() => void} Unsubscribe function
   */
  on(type, handler) {
    let set = this.#handlers.get(type);
    if (!set) {
      set = new Set();
      this.#handlers.set(type, set);
    }
    set.add(handler);
    return () => {
      const current = this.#handlers.get(type);
      if (current) current.delete(handler);
    };
  }

  /**
   * Synchronously dispatch an event to all registered listeners.
   * @param {{ type: string, [key: string]: any }} event
   */
  emit(event) {
    if (!event || !event.type) return;
    const set = this.#handlers.get(event.type);
    if (!set) return;
    for (const handler of set) {
      try {
        handler(event);
      } catch (err) {
        console.error(`[EventBus] handler error on event "${event.type}":`, err);
      }
    }
  }

  /**
   * Clear all registered handlers.
   */
  clear() {
    this.#handlers.clear();
  }
}
