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
}

const events = new ZeroTwoEvents();

export default events;