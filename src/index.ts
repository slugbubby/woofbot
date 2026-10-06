import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { sql } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "./db/index.js";
import { overlayRoutes } from "./overlay/routes.js";
import { devRoutes } from "./dev/routes.js";

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

const port = Number(process.env.PORT || 6969);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`listening on http://localhost:${info.port}`);
});

export default app;
