import { Hono } from "hono";
import { serve } from "@hono/node-server";

const app = new Hono();

app.get("/", (c) => {
  return c.text("woof!");
});

const port = Number(process.env.PORT || 6969);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`listening on http://localhost:${info.port}`);
});

export default app;
