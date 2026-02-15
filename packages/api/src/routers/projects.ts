import crypto from "node:crypto";

import { Project } from "@full-tester/db/models/project.model";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

export const projectsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return Project.find({ userId }).sort({ createdAt: -1 }).lean();
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return Project.findOne({ _id: input.id, userId: ctx.session.user.id }).lean();
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        domainName: z.string().min(1),
        url: z.string().default(""),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return Project.create({
        _id: crypto.randomUUID(),
        userId,
        name: input.name,
        domainName: input.domainName,
        url: input.url,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        domainName: z.string().min(1),
        url: z.string().default(""),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return Project.findOneAndUpdate(
        { _id: input.id, userId },
        {
          name: input.name,
          domainName: input.domainName,
          url: input.url,
        },
        { new: true },
      ).lean();
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      await Project.deleteOne({ _id: input.id, userId });
      return { success: true };
    }),
});
