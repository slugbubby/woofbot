import { EventEmitter } from "node:events";

export type OverlayEvent = {
  type: "woof"; // Can expand to 'meow' etc later
  user?: string;
};

const bus = new EventEmitter();
bus.setMaxListeners(0); // One listener per connected overlay; no arbitrary cap

/**
 * Emit/broadcast an overlay event to all connected overlays.
 */
export function emitOverlayEvent(event: OverlayEvent) {
  bus.emit("event", event);
}

/**
 * Subscribe to overlay events.
 * @param listener - The callback function to handle overlay events.
 * @returns A function to unsubscribe from overlay events.
 */
export function onOverlayEvent(listener: (event: OverlayEvent) => void) {
  bus.on("event", listener);
  return () => {
    bus.off("event", listener);
  };
}
