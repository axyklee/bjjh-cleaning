import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { settingsRouter } from "./routers/admin/settings";
import { evaluateRouter } from "./routers/admin/evaluate";
import { adminHomeRouter } from "./routers/admin/home";
import { viewHomeRouter } from "./routers/view/home";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  admin: {
    settings: settingsRouter,
    evaluate: evaluateRouter,
    home: adminHomeRouter,
  },
  view: {
    home: viewHomeRouter
  }
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
