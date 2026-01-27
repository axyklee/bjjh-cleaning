import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import type { D1Database } from "@cloudflare/workers-types";

import { env } from "~/env";

const createPrismaClient = () => {
  // Check if we're running in a Cloudflare Worker environment
  // In Cloudflare Workers with @cloudflare/next-on-pages, D1 database bindings
  // are available on globalThis. The binding name 'DB' in wrangler.toml
  // makes the D1 database available as globalThis.DB
  const d1Database = (globalThis as { DB?: D1Database }).DB;
  
  if (d1Database) {
    // Use D1 adapter for Cloudflare Workers
    const adapter = new PrismaD1(d1Database);
    return new PrismaClient({
      adapter,
      log:
        env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }
  
  // Use standard Prisma client for Node.js environments
  return new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
