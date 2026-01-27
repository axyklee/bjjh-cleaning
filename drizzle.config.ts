import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  driver: "d1-http",
  dbCredentials: {
    // For local development
    url: process.env.DATABASE_URL || "file:./dev.db",
  },
});
