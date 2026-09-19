import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createSavedScenario, deleteSavedScenario, listSavedScenarios } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

const pointSchema = z.object({ lat: z.number(), lon: z.number() });
const nodeSchema = pointSchema.extend({ id: z.string().max(120), name: z.string().min(1).max(120), orders: z.number().min(0).max(10_000_000) });
const paramsSchema = z.object({
  k: z.number().int().min(1).max(12), algorithm: z.enum(["kmeans", "kmedoids"]), costPerKm: z.number().min(0).max(100_000), fixedCost: z.number().min(0).max(100_000_000),
  useVehicles: z.boolean(), useCapacity: z.boolean(), capacity: z.number().min(1).max(10_000_000), useRadius: z.boolean(), radius: z.number().min(1).max(100), surge: z.number().min(-90).max(500),
});
const snapshotSchema = z.object({ version: z.literal(1), nodes: z.array(nodeSchema).min(2).max(80), params: paramsSchema, manualHubs: z.array(pointSchema).max(12).nullable() });

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  scenario: router({
    list: protectedProcedure.query(async ({ ctx }) => listSavedScenarios(ctx.user.id)),
    save: protectedProcedure.input(z.object({ name: z.string().trim().min(1).max(120), dataset: z.string().min(1).max(32), snapshot: snapshotSchema })).mutation(async ({ ctx, input }) => {
      try {
        await createSavedScenario(ctx.user.id, { name: input.name, dataset: input.dataset, payload: JSON.stringify(input.snapshot) });
        return { success: true } as const;
      } catch (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error instanceof Error ? error.message : "Unable to save scenario" });
      }
    }),
    delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      try {
        await deleteSavedScenario(ctx.user.id, input.id);
        return { success: true } as const;
      } catch (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error instanceof Error ? error.message : "Unable to delete scenario" });
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
