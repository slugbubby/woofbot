import { Hono } from "hono";

import { emitOverlayEvent } from "../overlay/events.js";

export const devRoutes = new Hono().get("/woof", (c) => {
  emitOverlayEvent({ type: "woof", user: "dev" });
  return c.json({ ok: true });
});
