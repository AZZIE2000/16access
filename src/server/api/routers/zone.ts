import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const zoneRouter = createTRPCRouter({
  // Get all zones (excluding soft-deleted)
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.zone.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            vendors: true,
            employees: true,
          },
        },
      },
    });
  }),

  // Get a single zone by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const zone = await ctx.db.zone.findUnique({
        where: { id: input.id },
        include: {
          vendors: {
            include: {
              vendor: true,
            },
          },
          employees: {
            include: {
              employee: true,
            },
          },
        },
      });

      if (!zone || zone.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Zone not found",
        });
      }

      return zone;
    }),

  // Create a new zone
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if zone with same name already exists
      const existingZone = await ctx.db.zone.findFirst({
        where: {
          name: input.name,
          deletedAt: null,
        },
      });

      if (existingZone) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A zone with this name already exists",
        });
      }

      const zone = await ctx.db.zone.create({
        data: {
          name: input.name,
          description: input.description,
        },
      });

      return {
        success: true,
        zone,
      };
    }),

  // Update a zone
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Name is required"),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if zone exists
      const existingZone = await ctx.db.zone.findUnique({
        where: { id: input.id },
      });

      if (!existingZone || existingZone.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Zone not found",
        });
      }

      // Check if another zone with same name exists
      const duplicateZone = await ctx.db.zone.findFirst({
        where: {
          name: input.name,
          deletedAt: null,
          id: { not: input.id },
        },
      });

      if (duplicateZone) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A zone with this name already exists",
        });
      }

      const zone = await ctx.db.zone.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
        },
      });

      return {
        success: true,
        zone,
      };
    }),

  // Soft delete a zone
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const zone = await ctx.db.zone.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              vendors: true,
              employees: true,
            },
          },
        },
      });

      if (!zone || zone.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Zone not found",
        });
      }

      // Check if zone has associated vendors or employees
      if (zone._count.vendors > 0 || zone._count.employees > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Cannot delete zone with associated vendors or employees. Please reassign them first.",
        });
      }

      await ctx.db.zone.update({
        where: { id: input.id },
        data: {
          deletedAt: new Date(),
        },
      });

      return {
        success: true,
        message: "Zone deleted successfully",
      };
    }),
});
