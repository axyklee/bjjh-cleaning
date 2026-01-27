import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { drizzle as drizzleBetterSqlite } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import type { D1Database } from "@cloudflare/workers-types";

import { env } from "~/env";
import * as schema from "./schema";

const createDrizzleClient = () => {
  // Check if we're running in a Cloudflare Worker environment
  // In Cloudflare Workers with @opennextjs/cloudflare, D1 database bindings
  // are available on globalThis. The binding name 'DB' in wrangler.jsonc
  // makes the D1 database available as globalThis.DB
  const d1Database = (globalThis as { DB?: D1Database }).DB;
  
  if (d1Database) {
    // Use D1 driver for Cloudflare Workers
    return drizzleD1(d1Database, { schema });
  }
  
  // Use better-sqlite3 for local development and Node.js environments
  const sqlite = new Database(env.DATABASE_URL);
  return drizzleBetterSqlite(sqlite, { schema });
};

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof createDrizzleClient> | undefined;
};

export const db = globalForDb.db ?? createDrizzleClient();

if (env.NODE_ENV !== "production") globalForDb.db = db;

// Export types
export type Database = typeof db;
