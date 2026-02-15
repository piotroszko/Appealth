import { protectedProcedure, publicProcedure, router } from "../index";
import { domainsRouter } from "./domains";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  domains: domainsRouter,
});
export type AppRouter = typeof appRouter;
