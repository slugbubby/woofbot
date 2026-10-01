import { serve } from "@hono/node-server";
import { sql } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "./db/index.js";

const app = new Hono();

app.get("/", (c) => {
  return c.text("woof!");
});

app.get("/health", async (c) => {
  await db.execute(sql`select 1`);
  return c.json({ ok: true });
});

const port = Number(process.env.PORT || 6969);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`listening on http://localhost:${info.port}`);
});

export default app;
