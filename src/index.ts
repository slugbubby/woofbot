import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { sql } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "./db/index.js";
import { devRoutes } from "./dev/routes.js";
import { overlayRoutes } from "./overlay/routes.js";
import { connectToTwitchChat } from "./twitch/client.js";
import { twitchAuthRoutes } from "./twitch/routes.js";

const app = new Hono();

app.get("/", (c) => {
  return c.text("woof!");
});

if (process.env.NODE_ENV !== "production") {
  app.route("/dev", devRoutes);
}

app.get("/health", async (c) => {
  await db.execute(sql`select 1`);
  return c.json({ ok: true });
});

app.route("/overlay", overlayRoutes);

app.use("/sounds/*", serveStatic({ root: "./public" }));

app.route("/auth/twitch", twitchAuthRoutes);

const port = Number(process.env.PORT || 6969);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Listening on http://localhost:${info.port}`);
});

connectToTwitchChat().catch((err) =>
  console.error("Failed to connect to Twitch chat", err),
);

export default app;
