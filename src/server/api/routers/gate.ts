import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const gateRouter = createTRPCRouter({
  // Get all gates (excluding soft-deleted)
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.gate.findMany({
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
            activities: true,
          },
        },
      },
    });
  }),

  // Get a single gate by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const gate = await ctx.db.gate.findUnique({
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
          activities: true,
        },
      });

      if (!gate || gate.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Gate not found",
        });
      }

      return gate;
    }),

  // Create a new gate
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if gate with same name already exists
      const existingGate = await ctx.db.gate.findFirst({
        where: {
          name: input.name,
          deletedAt: null,
        },
      });

      if (existingGate) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A gate with this name already exists",
        });
      }

      const gate = await ctx.db.gate.create({
        data: {
          name: input.name,
          description: input.description,
        },
      });

      return {
        success: true,
        gate,
      };
    }),

  // Update a gate
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Name is required"),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if gate exists
      const existingGate = await ctx.db.gate.findUnique({
        where: { id: input.id },
      });

      if (!existingGate || existingGate.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Gate not found",
        });
      }

      // Check if another gate with same name exists
      const duplicateGate = await ctx.db.gate.findFirst({
        where: {
          name: input.name,
          deletedAt: null,
          id: { not: input.id },
        },
      });

      if (duplicateGate) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A gate with this name already exists",
        });
      }

      const gate = await ctx.db.gate.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
        },
      });

      return {
        success: true,
        gate,
      };
    }),

  // Soft delete a gate
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const gate = await ctx.db.gate.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              vendors: true,
              employees: true,
              activities: true,
            },
          },
        },
      });

      if (!gate || gate.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Gate not found",
        });
      }

      // Check if gate has associated vendors or employees
      if (gate._count.vendors > 0 || gate._count.employees > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Cannot delete gate with associated vendors or employees. Please reassign them first.",
        });
      }

      await ctx.db.gate.update({
        where: { id: input.id },
        data: {
          deletedAt: new Date(),
        },
      });

      return {
        success: true,
        message: "Gate deleted successfully",
      };
    }),
});
