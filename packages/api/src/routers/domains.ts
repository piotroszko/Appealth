import crypto from "node:crypto";

import { Domain } from "@full-tester/db/models/domain.model";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

export const domainsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return Domain.find({ userId }).sort({ createdAt: -1 }).lean();
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        websites: z.array(z.string()).default([]),
        allowedExternalDomains: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return Domain.create({
        _id: crypto.randomUUID(),
        userId,
        name: input.name,
        websites: input.websites,
        allowedExternalDomains: input.allowedExternalDomains,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        websites: z.array(z.string()).default([]),
        allowedExternalDomains: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return Domain.findOneAndUpdate(
        { _id: input.id, userId },
        {
          name: input.name,
          websites: input.websites,
          allowedExternalDomains: input.allowedExternalDomains,
        },
        { new: true },
      ).lean();
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      await Domain.deleteOne({ _id: input.id, userId });
      return { success: true };
    }),
});
