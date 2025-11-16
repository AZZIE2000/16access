import { postRouter } from "@/server/api/routers/post";
import { userRouter } from "@/server/api/routers/user";
import { zoneRouter } from "@/server/api/routers/zone";
import { gateRouter } from "@/server/api/routers/gate";
import { vendorRouter } from "@/server/api/routers/vendor";
import { employeeRouter } from "@/server/api/routers/employee";
import { activityRouter } from "@/server/api/routers/activity";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  user: userRouter,
  zone: zoneRouter,
  gate: gateRouter,
  vendor: vendorRouter,
  employee: employeeRouter,
  activity: activityRouter,
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
