import crypto from "node:crypto";

import { Website } from "@full-tester/db/models/website.model";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

export const websitesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return Website.find({ userId }).sort({ createdAt: -1 }).lean();
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        url: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return Website.create({
        _id: crypto.randomUUID(),
        userId,
        name: input.name,
        url: input.url,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        url: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return Website.findOneAndUpdate(
        { _id: input.id, userId },
        { name: input.name, url: input.url },
        { new: true },
      ).lean();
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      await Website.deleteOne({ _id: input.id, userId });
      return { success: true };
    }),
});
