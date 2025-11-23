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
              gates: {
                include: {
                  gate: true,
                },
              },
              zones: {
                include: {
                  zone: true,
                },
              },
            },
          },
          gates: {
            include: {
              gate: true,
            },
          },
          zones: {
            include: {
              zone: true,
            },
          },
          workingHours: true,
          employeeAttachments: {
            include: {
              attachment: true,
            },
          },
          allowedDates: {
            orderBy: {
              date: "asc",
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

      // Get the last activity for this employee
      const lastActivity = await ctx.db.activity.findFirst({
        where: {
          employeeId: employee.id,
        },
        orderBy: {
          scannedAt: "desc",
        },
      });

      // Get all coworkers (employees from the same vendor, excluding deleted)
      const coworkers = await ctx.db.employee.findMany({
        where: {
          vendorId: employee.vendorId,
          deletedAt: null,
          id: {
            not: employee.id, // Exclude the current employee
          },
        },
        include: {
          activities: {
            take: 1,
            orderBy: {
              scannedAt: "desc",
            },
          },
          employeeAttachments: {
            where: {
              type: "PROFILE_PHOTO",
            },
            include: {
              attachment: true,
            },
          },
        },
      });

      return {
        ...employee,
        profilePhoto: employee.employeeAttachments?.find(
          (att) => att.type === "PROFILE_PHOTO",
        )?.attachment.url,
        lastActivity,
        coworkers: coworkers.map((coworker) => ({
          id: coworker.id,
          name: coworker.name,
          job: coworker.job,
          status: coworker.status,
          bypassConcurrentLimit: coworker.bypassConcurrentLimit,
          profilePhoto: coworker.employeeAttachments[0]?.attachment.url,
          lastActivity: coworker.activities[0] ?? null,
        })),
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
      // Verify that the scanner (current user) exists in the database
      const scanner = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      // If this is an ENTRY with GRANTED status, check vendor's allowedInCount
      if (input.type === "ENTRY" && input.status === "GRANTED") {
        const employee = await ctx.db.employee.findUnique({
          where: { id: input.employeeId },
          include: {
            vendor: true,
          },
        });

        if (
          employee?.vendor.allowedInCount &&
          employee.vendor.allowedInCount > 0 &&
          !employee.bypassConcurrentLimit // Skip check if employee has bypass flag
        ) {
          // Get all employees from the same vendor (excluding those with bypass flag)
          const vendorEmployees = await ctx.db.employee.findMany({
            where: {
              vendorId: employee.vendorId,
              deletedAt: null,
              bypassConcurrentLimit: false, // Only count employees without bypass flag
            },
            select: {
              id: true,
            },
          });

          const employeeIds = vendorEmployees.map((e) => e.id);

          // Get the last activity for each employee
          const lastActivities = await ctx.db.activity.findMany({
            where: {
              employeeId: {
                in: employeeIds,
              },
            },
            orderBy: {
              scannedAt: "desc",
            },
            distinct: ["employeeId"],
          });

          // Count how many employees currently have ENTRY as their last activity
          const currentlyInCount = lastActivities.filter(
            (activity) => activity.type === "ENTRY",
          ).length;

          // Check if adding this employee would exceed the limit
          if (currentlyInCount >= employee.vendor.allowedInCount) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Vendor has reached maximum allowed employees in (${employee.vendor.allowedInCount}). Please ask someone to exit first.`,
            });
          }
        }
      }

      const activity = await ctx.db.activity.create({
        data: {
          type: input.type,
          status: input.status,
          denialReason: input.denialReason,
          employeeId: input.employeeId,
          scannerId: scanner ? ctx.session.user.id : null, // Only set if user exists
          gateId: input.gateId,
        },
        include: {
          employee: {
            include: {
              vendor: true,
              gates: {
                include: {
                  gate: true,
                },
              },
              zones: {
                include: {
                  zone: true,
                },
              },
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
              gates: {
                include: {
                  gate: true,
                },
              },
              zones: {
                include: {
                  zone: true,
                },
              },
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
              gates: {
                include: {
                  gate: true,
                },
              },
              zones: {
                include: {
                  zone: true,
                },
              },
            },
          },
          gates: {
            include: {
              gate: true,
            },
          },
          zones: {
            include: {
              zone: true,
            },
          },
          workingHours: true,
          employeeAttachments: {
            include: {
              attachment: true,
            },
          },
          allowedDates: {
            orderBy: {
              date: "asc",
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
              gates: {
                include: {
                  gate: true,
                },
              },
              zones: {
                include: {
                  zone: true,
                },
              },
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
