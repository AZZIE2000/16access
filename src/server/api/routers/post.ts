import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(async ({ input, ctx }) => {
      const res = await ctx.db.user.findMany();
      return {
        greeting: `Hello ${input.text}, ${res.length}`,
      };
    }),

  create: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.post.create({
        data: {
          name: input.name,
          createdBy: { connect: { id: "cmhtdkzrv0000b1eqc2fn195k" } },
        },
      });
    }),

  getLatest: publicProcedure.query(async ({ ctx }) => {
    const post = await ctx.db.post.findFirst({
      orderBy: { createdAt: "desc" },
      where: { createdBy: { id: "cmhtdkzrv0000b1eqc2fn195k" } },
    });

    return post ?? null;
  }),

  getSecretMessage: publicProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
