import { defineConfig } from "drizzle-kit";

// Load .env locally; on Railway there's no file and vars are already set.
try {
  process.loadEnvFile();
} catch {}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
