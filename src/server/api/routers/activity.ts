import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const activityRouter = createTRPCRouter({
  // Get employee info by QR code (no validation, just show info)
  getEmployeeByQRCode: protectedProcedure
    .input(
      z.object({
        identifier: z.string(), // Employee identifier from QR code
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Find employee by identifier
      const employee = await ctx.db.employee.findFirst({
        where: {
          identifier: input.identifier,
          deletedAt: null,
        },
        include: {
          vendor: {
            include: {
              gate: true,
              zone: true,
            },
          },
          gate: true,
          zone: true,
          workingHours: true,
          employeeAttachments: {
            include: {
              attachment: true,
            },
          },
          activities: {
            take: 3,
            orderBy: {
              scannedAt: "desc",
            },
            include: {
              scanner: true,
              gate: true,
            },
          },
        },
      });

      if (!employee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Employee not found",
        });
      }

      return {
        ...employee,
        profilePhoto: employee.employeeAttachments?.find(
          (att) => att.type === "PROFILE_PHOTO",
        )?.attachment.url,
      };
    }),

  // Record activity (called when usher clicks grant/deny/exit)
  recordActivity: protectedProcedure
    .input(
      z.object({
        employeeId: z.string(),
        gateId: z.string(),
        type: z.enum(["ENTRY", "EXIT", "DENIED"]),
        status: z.enum(["GRANTED", "DENIED"]),
        denialReason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const activity = await ctx.db.activity.create({
        data: {
          type: input.type,
          status: input.status,
          denialReason: input.denialReason,
          employeeId: input.employeeId,
          scannerId: ctx.session.user.id,
          gateId: input.gateId,
        },
        include: {
          employee: {
            include: {
              vendor: true,
              gate: true,
              zone: true,
              employeeAttachments: {
                include: {
                  attachment: true,
                },
              },
            },
          },
          scanner: true,
          gate: true,
        },
      });

      return {
        success: true,
        activity: {
          ...activity,
          employee: {
            ...activity.employee,
            profilePhoto: activity.employee.employeeAttachments?.find(
              (att) => att.type === "PROFILE_PHOTO",
            )?.attachment.url,
          },
        },
      };
    }),

  // Get recent activities (for history page)
  getRecent: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          gateId: z.string().optional(),
          status: z.enum(["GRANTED", "DENIED"]).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const activities = await ctx.db.activity.findMany({
        where: {
          ...(input?.gateId && { gateId: input.gateId }),
          ...(input?.status && { status: input.status }),
          scannerId: ctx.session.user.id,
        },
        take: input?.limit ?? 50,
        orderBy: {
          scannedAt: "desc",
        },
        include: {
          employee: {
            include: {
              vendor: true,
              gate: true,
              zone: true,
              employeeAttachments: {
                include: {
                  attachment: true,
                },
              },
            },
          },
          scanner: true,
          gate: true,
        },
      });

      return activities;
    }),

  // Get activities by employee
  getByEmployee: protectedProcedure
    .input(z.object({ employeeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const activities = await ctx.db.activity.findMany({
        where: {
          employeeId: input.employeeId,
        },
        orderBy: {
          scannedAt: "desc",
        },
        include: {
          scanner: true,
          gate: true,
        },
      });

      return activities;
    }),

  // Get employee by identifier (for scan preview)
  getEmployeeByIdentifier: protectedProcedure
    .input(z.object({ identifier: z.string() }))
    .query(async ({ ctx, input }) => {
      const employee = await ctx.db.employee.findFirst({
        where: {
          identifier: input.identifier,
          deletedAt: null,
        },
        include: {
          vendor: {
            include: {
              gate: true,
              zone: true,
            },
          },
          gate: true,
          zone: true,
          workingHours: true,
          employeeAttachments: {
            include: {
              attachment: true,
            },
          },
        },
      });

      if (!employee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Employee not found",
        });
      }

      return {
        ...employee,
        profilePhoto: employee.employeeAttachments?.find(
          (att) => att.type === "PROFILE_PHOTO",
        )?.attachment.url,
      };
    }),

  // Get all recent activities (admin only - no scannerId filter)
  getAllRecent: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          gateId: z.string().optional(),
          status: z.enum(["GRANTED", "DENIED"]).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view all activities",
        });
      }

      const activities = await ctx.db.activity.findMany({
        where: {
          ...(input?.gateId && { gateId: input.gateId }),
          ...(input?.status && { status: input.status }),
        },
        take: input?.limit ?? 50,
        orderBy: {
          scannedAt: "desc",
        },
        include: {
          employee: {
            include: {
              vendor: true,
              gate: true,
              zone: true,
              employeeAttachments: {
                include: {
                  attachment: true,
                },
              },
            },
          },
          scanner: true,
          gate: true,
        },
      });

      return activities;
    }),

  // Get dashboard statistics (admin only)
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    // Check if user is admin
    if (ctx.session.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can view dashboard statistics",
      });
    }

    // Count total vendors
    const totalVendors = await ctx.db.vendor.count({
      where: {
        deletedAt: null,
      },
    });

    // Count total employees
    const totalEmployees = await ctx.db.employee.count({
      where: {
        deletedAt: null,
      },
    });

    // Get employees currently on-site (last activity was ENTRY with GRANTED status)
    const employeesOnSite = await ctx.db.employee.findMany({
      where: {
        deletedAt: null,
        activities: {
          some: {},
        },
      },
      include: {
        activities: {
          orderBy: {
            scannedAt: "desc",
          },
          take: 1,
        },
      },
    });

    // Filter to only those whose last activity was an entry
    const onSiteCount = employeesOnSite.filter((emp) => {
      const lastActivity = emp.activities[0];
      return (
        lastActivity &&
        lastActivity.type === "ENTRY" &&
        lastActivity.status === "GRANTED"
      );
    }).length;

    return {
      totalVendors,
      totalEmployees,
      employeesOnSite: onSiteCount,
    };
  }),
});
