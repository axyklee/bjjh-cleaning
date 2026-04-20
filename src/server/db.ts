import { PrismaClient } from "@prisma/client";

import { env } from "~/env";

const buildDatasourceUrl = () => {
  try {
    const url = new URL(env.DATABASE_URL);
    url.searchParams.set("connection_limit", "1");
    return url.toString();
  } catch {
    throw new Error(
      `DATABASE_URL is not a valid URL: "${env.DATABASE_URL}"`,
    );
  }
};

const createPrismaClient = () =>
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasourceUrl: buildDatasourceUrl(),
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
