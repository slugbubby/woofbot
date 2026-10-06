import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";

import { onOverlayEvent } from "./events.js";

export const overlayRoutes = new Hono()
  .get("/", serveStatic({ path: "./client/overlay.html" }))

  .get("/events", (c) =>
    streamSSE(c, async (stream) => {
      const unsubscribe = onOverlayEvent((event) => {
        stream
          .writeSSE({ event: event.type, data: JSON.stringify(event) })
          .catch(() => {});
      });
      stream.onAbort(unsubscribe);

      while (!stream.aborted) {
        await stream.writeSSE({ event: "ping", data: "" });
        await stream.sleep(15_000);
      }
    }),
  );
