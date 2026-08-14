import { EventEmitter } from "node:events";

class ZeroTwoEvents extends EventEmitter {
  constructor() {
    super();

    this.setMaxListeners(100);
  }

  emitBotEvent(eventName, payload = {}) {
    this.emit(eventName, {
      timestamp: new Date(),
      ...payload
    });
  }

  /**
   * Register a listener only once for a given
   * event + listener combination.
   *
   * This prevents accidental duplicate listeners
   * during development/reinitialization.
   */
  on(eventName, listener) {
    const listeners =
      this.listeners(eventName);

    if (listeners.includes(listener)) {
      return this;
    }

    return super.on(
      eventName,
      listener
    );
  }

  /**
   * Register a one-time listener only once.
   */
  once(eventName, listener) {
    const listeners =
      this.listeners(eventName);

    if (listeners.includes(listener)) {
      return this;
    }

    return super.once(
      eventName,
      listener
    );
  }

  /**
   * Remove a specific listener.
   */
  off(eventName, listener) {
    return super.off(
      eventName,
      listener
    );
  }

  /**
   * Get useful listener diagnostics.
   */
  getListenerStats() {
    const events = this.eventNames();

    const stats = {};

    for (const eventName of events) {
      stats[eventName] =
        this.listenerCount(eventName);
    }

    return stats;
  }
}

const events =
  new ZeroTwoEvents();

export default events;