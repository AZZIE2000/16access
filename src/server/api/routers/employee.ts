import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";
import { utapi } from "@/server/uploadthing";

export const employeeRouter = createTRPCRouter({
  // Get all unique job titles (admin only)
  getUniqueJobTitles: protectedProcedure.query(async ({ ctx }) => {
    const employees = await ctx.db.employee.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        job: true,
      },
      distinct: ["job"],
      orderBy: {
        job: "asc",
      },
    });

    return employees.map((e) => e.job);
  }),

  // Get unique job titles for a vendor (public - for vendor portal)
  getUniqueJobTitlesByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const vendor = await ctx.db.vendor.findUnique({
        where: {
          accessToken: input.token,
          deletedAt: null,
        },
      });

      if (!vendor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid access token",
        });
      }

      const employees = await ctx.db.employee.findMany({
        where: {
          vendorId: vendor.id,
          deletedAt: null,
        },
        select: {
          job: true,
        },
        distinct: ["job"],
        orderBy: {
          job: "asc",
        },
      });

      return employees.map((e) => e.job);
    }),

  // Get vendor by access token (public - for vendor portal)
  getVendorByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const vendor = await ctx.db.vendor.findUnique({
        where: {
          accessToken: input.token,
          deletedAt: null,
        },
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
          employees: {
            where: {
              deletedAt: null,
            },
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
              employeeAttachments: {
                include: {
                  attachment: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

      if (!vendor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid access token",
        });
      }

      return vendor;
    }),

  // Get a single employee by ID (with token validation)
  getById: publicProcedure
    .input(
      z.object({
        id: z.string(),
        token: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Validate token first
      const vendor = await ctx.db.vendor.findUnique({
        where: {
          accessToken: input.token,
          deletedAt: null,
        },
      });

      if (!vendor) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid access token",
        });
      }

      const employee = await ctx.db.employee.findUnique({
        where: { id: input.id },
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
          vendor: true,
          employeeAttachments: {
            include: {
              attachment: true,
            },
          },
        },
      });

      if (!employee || employee.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Employee not found",
        });
      }

      // Verify employee belongs to this vendor
      if (employee.vendorId !== vendor.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This employee does not belong to your vendor account",
        });
      }

      return employee;
    }),

  // Create a new employee (with token validation)
  create: publicProcedure
    .input(
      z.object({
        token: z.string(),
        name: z.string().min(1, "Name is required"),
        job: z.string().min(1, "Job/Role is required"),
        nationalId: z
          .string()
          .regex(/^\d{10}$/, "National ID must be exactly 10 digits"),
        gateIds: z.array(z.string()).optional(),
        zoneIds: z.array(z.string()).optional(),
        profilePhotoUrl: z.string().min(1, "Profile photo is required"),
        idCardUrls: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Validate token and get vendor
      const vendor = await ctx.db.vendor.findUnique({
        where: {
          accessToken: input.token,
          deletedAt: null,
        },
        include: {
          _count: {
            select: {
              employees: {
                where: {
                  deletedAt: null,
                },
              },
            },
          },
        },
      });

      if (!vendor) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid access token",
        });
      }

      // Check if vendor has reached staff limit
      if (vendor._count.employees >= vendor.allowedStaffCount) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `You have reached the maximum allowed staff count of ${vendor.allowedStaffCount}`,
        });
      }

      // Validate gates exist if provided
      if (input.gateIds && input.gateIds.length > 0) {
        const gates = await ctx.db.gate.findMany({
          where: {
            id: { in: input.gateIds },
            deletedAt: null,
          },
        });
        if (gates.length !== input.gateIds.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "One or more selected gates not found",
          });
        }
      }

      // Validate zones exist if provided
      if (input.zoneIds && input.zoneIds.length > 0) {
        const zones = await ctx.db.zone.findMany({
          where: {
            id: { in: input.zoneIds },
            deletedAt: null,
          },
        });
        if (zones.length !== input.zoneIds.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "One or more selected zones not found",
          });
        }
      }

      const employee = await ctx.db.employee.create({
        data: {
          name: input.name,
          job: input.job,
          nationalId: input.nationalId,
          vendorId: vendor.id,
          gates: input.gateIds
            ? {
                create: input.gateIds.map((gateId) => ({
                  gateId,
                })),
              }
            : undefined,
          zones: input.zoneIds
            ? {
                create: input.zoneIds.map((zoneId) => ({
                  zoneId,
                })),
              }
            : undefined,
        },
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
          vendor: true,
        },
      });

      // Create attachments if provided
      if (input.profilePhotoUrl) {
        const profileAttachment = await ctx.db.attachment.create({
          data: {
            url: input.profilePhotoUrl,
            mimeType: "image/jpeg",
          },
        });

        await ctx.db.employeeAttachment.create({
          data: {
            employeeId: employee.id,
            attachmentId: profileAttachment.id,
            type: "PROFILE_PHOTO",
          },
        });
      }

      // Create ID card attachments (multiple)
      if (input.idCardUrls && input.idCardUrls.length > 0) {
        for (const idCardUrl of input.idCardUrls) {
          const idCardAttachment = await ctx.db.attachment.create({
            data: {
              url: idCardUrl,
              mimeType: "image/jpeg",
            },
          });

          await ctx.db.employeeAttachment.create({
            data: {
              employeeId: employee.id,
              attachmentId: idCardAttachment.id,
              type: "ID_CARD",
            },
          });
        }
      }

      return {
        success: true,
        employee,
      };
    }),

  // Update an employee (with token validation)
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        token: z.string(),
        name: z.string().min(1, "Name is required"),
        job: z.string().min(1, "Job/Role is required"),
        nationalId: z
          .string()
          .regex(/^\d{10}$/, "National ID must be exactly 10 digits"),
        gateIds: z.array(z.string()).optional().nullable(),
        zoneIds: z.array(z.string()).optional().nullable(),
        profilePhotoUrl: z.string().min(1, "Profile photo is required"),
        idCardUrls: z.array(z.string()).optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Validate token
      const vendor = await ctx.db.vendor.findUnique({
        where: {
          accessToken: input.token,
          deletedAt: null,
        },
      });

      if (!vendor) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid access token",
        });
      }

      // Check if employee exists
      const existingEmployee = await ctx.db.employee.findUnique({
        where: { id: input.id },
      });

      if (!existingEmployee || existingEmployee.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Employee not found",
        });
      }

      // Verify employee belongs to this vendor
      if (existingEmployee.vendorId !== vendor.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This employee does not belong to your vendor account",
        });
      }

      // Validate gates exist if provided
      if (input.gateIds && input.gateIds.length > 0) {
        const gates = await ctx.db.gate.findMany({
          where: {
            id: { in: input.gateIds },
            deletedAt: null,
          },
        });
        if (gates.length !== input.gateIds.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "One or more selected gates not found",
          });
        }
      }

      // Validate zones exist if provided
      if (input.zoneIds && input.zoneIds.length > 0) {
        const zones = await ctx.db.zone.findMany({
          where: {
            id: { in: input.zoneIds },
            deletedAt: null,
          },
        });
        if (zones.length !== input.zoneIds.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "One or more selected zones not found",
          });
        }
      }

      // Delete existing gate and zone relations
      await ctx.db.employeeGate.deleteMany({
        where: { employeeId: input.id },
      });
      await ctx.db.employeeZone.deleteMany({
        where: { employeeId: input.id },
      });

      const employee = await ctx.db.employee.update({
        where: { id: input.id },
        data: {
          name: input.name,
          job: input.job,
          nationalId: input.nationalId,
          gates: input.gateIds
            ? {
                create: input.gateIds.map((gateId) => ({
                  gateId,
                })),
              }
            : undefined,
          zones: input.zoneIds
            ? {
                create: input.zoneIds.map((zoneId) => ({
                  zoneId,
                })),
              }
            : undefined,
        },
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
          vendor: true,
        },
      });

      // Update profile photo if provided
      if (input.profilePhotoUrl) {
        // Delete existing profile photo attachment
        const existingProfilePhoto = await ctx.db.employeeAttachment.findFirst({
          where: {
            employeeId: employee.id,
            type: "PROFILE_PHOTO",
          },
          include: {
            attachment: true,
          },
        });

        if (existingProfilePhoto) {
          await ctx.db.employeeAttachment.delete({
            where: { id: existingProfilePhoto.id },
          });
          await ctx.db.attachment.delete({
            where: { id: existingProfilePhoto.attachmentId },
          });
        }

        // Create new profile photo attachment
        const profileAttachment = await ctx.db.attachment.create({
          data: {
            url: input.profilePhotoUrl,
            mimeType: "image/jpeg",
          },
        });

        await ctx.db.employeeAttachment.create({
          data: {
            employeeId: employee.id,
            attachmentId: profileAttachment.id,
            type: "PROFILE_PHOTO",
          },
        });
      }

      // Update ID cards if provided (multiple)
      if (input.idCardUrls !== undefined) {
        // Delete all existing ID card attachments
        const existingIdCards = await ctx.db.employeeAttachment.findMany({
          where: {
            employeeId: employee.id,
            type: "ID_CARD",
          },
          include: {
            attachment: true,
          },
        });

        for (const existingIdCard of existingIdCards) {
          await ctx.db.employeeAttachment.delete({
            where: { id: existingIdCard.id },
          });
          await ctx.db.attachment.delete({
            where: { id: existingIdCard.attachmentId },
          });
        }

        // Create new ID card attachments
        if (input.idCardUrls && input.idCardUrls.length > 0) {
          for (const idCardUrl of input.idCardUrls) {
            const idCardAttachment = await ctx.db.attachment.create({
              data: {
                url: idCardUrl,
                mimeType: "image/jpeg",
              },
            });

            await ctx.db.employeeAttachment.create({
              data: {
                employeeId: employee.id,
                attachmentId: idCardAttachment.id,
                type: "ID_CARD",
              },
            });
          }
        }
      }

      return {
        success: true,
        employee,
      };
    }),

  // Delete an employee (with token validation)
  delete: publicProcedure
    .input(
      z.object({
        id: z.string(),
        token: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Validate token
      const vendor = await ctx.db.vendor.findUnique({
        where: {
          accessToken: input.token,
          deletedAt: null,
        },
      });

      if (!vendor) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid access token",
        });
      }

      const employee = await ctx.db.employee.findUnique({
        where: { id: input.id },
      });

      if (!employee || employee.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Employee not found",
        });
      }

      // Verify employee belongs to this vendor
      if (employee.vendorId !== vendor.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This employee does not belong to your vendor account",
        });
      }

      // Soft delete
      await ctx.db.employee.update({
        where: { id: input.id },
        data: {
          deletedAt: new Date(),
        },
      });

      return {
        success: true,
        message: "Employee deleted successfully",
      };
    }),

  // Delete file from UploadThing
  deleteFile: publicProcedure
    .input(
      z.object({
        fileUrl: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        // Extract file key from URL
        // URL format: https://utfs.io/f/{fileKey}
        const fileKey = input.fileUrl.split("/f/")[1];

        if (!fileKey) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid file URL",
          });
        }

        // Delete from UploadThing
        await utapi.deleteFiles(fileKey);

        return {
          success: true,
          message: "File deleted successfully",
        };
      } catch (error) {
        console.error("Error deleting file:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete file",
        });
      }
    }),

  // ==================== ADMIN PROCEDURES ====================

  // Get all employees (admin only)
  getAllAdmin: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          vendorId: z.string().optional(),
          gateId: z.string().optional(),
          zoneId: z.string().optional(),
          status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const where: {
        deletedAt: null;
        vendorId?: string;
        gates?: { some: { gateId: string } };
        zones?: { some: { zoneId: string } };
        status?: "PENDING" | "ACTIVE" | "SUSPENDED";
        OR?: Array<{
          name?: { contains: string; mode: "insensitive" };
          job?: { contains: string; mode: "insensitive" };
          vendor?: { name: { contains: string; mode: "insensitive" } };
        }>;
      } = {
        deletedAt: null,
      };

      if (input?.vendorId) {
        where.vendorId = input.vendorId;
      }

      if (input?.gateId) {
        where.gates = { some: { gateId: input.gateId } };
      }

      if (input?.zoneId) {
        where.zones = { some: { zoneId: input.zoneId } };
      }

      if (input?.status) {
        where.status = input.status;
      }

      if (input?.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { job: { contains: input.search, mode: "insensitive" } },
          {
            vendor: { name: { contains: input.search, mode: "insensitive" } },
          },
        ];
      }

      const employees = await ctx.db.employee.findMany({
        where,
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
          vendor: true,
          employeeAttachments: {
            include: {
              attachment: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return employees;
    }),

  // Get employee by ID (admin only)
  getByIdAdmin: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const employee = await ctx.db.employee.findUnique({
        where: { id: input.id },
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
          vendor: true,
          employeeAttachments: {
            include: {
              attachment: true,
            },
          },
        },
      });

      if (!employee || employee.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Employee not found",
        });
      }

      return employee;
    }),

  // Create employee (admin only - bypasses staff limit)
  createByAdmin: protectedProcedure
    .input(
      z.object({
        vendorId: z.string(),
        name: z.string().min(1, "Name is required"),
        job: z.string().min(1, "Job/Role is required"),
        nationalId: z
          .string()
          .regex(/^\d{10}$/, "National ID must be exactly 10 digits"),
        gateIds: z.array(z.string()).optional(),
        zoneIds: z.array(z.string()).optional(),
        profilePhotoUrl: z.string().min(1, "Profile photo is required"),
        idCardUrls: z.array(z.string()).optional(),
        status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]).default("PENDING"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Validate vendor exists
      const vendor = await ctx.db.vendor.findUnique({
        where: {
          id: input.vendorId,
          deletedAt: null,
        },
      });

      if (!vendor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vendor not found",
        });
      }

      // Auto-adjust allowedStaffCount if needed
      const currentEmployeeCount = await ctx.db.employee.count({
        where: {
          vendorId: input.vendorId,
          deletedAt: null,
        },
      });

      if (currentEmployeeCount >= vendor.allowedStaffCount) {
        await ctx.db.vendor.update({
          where: { id: input.vendorId },
          data: {
            allowedStaffCount: currentEmployeeCount + 1,
          },
        });
      }

      // Validate gates exist if provided
      if (input.gateIds && input.gateIds.length > 0) {
        const gates = await ctx.db.gate.findMany({
          where: {
            id: { in: input.gateIds },
            deletedAt: null,
          },
        });
        if (gates.length !== input.gateIds.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "One or more selected gates not found",
          });
        }
      }

      // Validate zones exist if provided
      if (input.zoneIds && input.zoneIds.length > 0) {
        const zones = await ctx.db.zone.findMany({
          where: {
            id: { in: input.zoneIds },
            deletedAt: null,
          },
        });
        if (zones.length !== input.zoneIds.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "One or more selected zones not found",
          });
        }
      }

      const employee = await ctx.db.employee.create({
        data: {
          name: input.name,
          job: input.job,
          nationalId: input.nationalId,
          vendorId: input.vendorId,
          status: input.status,
          gates: input.gateIds
            ? {
                create: input.gateIds.map((gateId) => ({
                  gateId,
                })),
              }
            : undefined,
          zones: input.zoneIds
            ? {
                create: input.zoneIds.map((zoneId) => ({
                  zoneId,
                })),
              }
            : undefined,
        },
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
          vendor: true,
        },
      });

      // Create attachments if provided
      if (input.profilePhotoUrl) {
        const profileAttachment = await ctx.db.attachment.create({
          data: {
            url: input.profilePhotoUrl,
            mimeType: "image/jpeg",
          },
        });

        await ctx.db.employeeAttachment.create({
          data: {
            employeeId: employee.id,
            attachmentId: profileAttachment.id,
            type: "PROFILE_PHOTO",
          },
        });
      }

      // Create ID card attachments (multiple)
      if (input.idCardUrls && input.idCardUrls.length > 0) {
        for (const idCardUrl of input.idCardUrls) {
          const idCardAttachment = await ctx.db.attachment.create({
            data: {
              url: idCardUrl,
              mimeType: "image/jpeg",
            },
          });

          await ctx.db.employeeAttachment.create({
            data: {
              employeeId: employee.id,
              attachmentId: idCardAttachment.id,
              type: "ID_CARD",
            },
          });
        }
      }

      return {
        success: true,
        employee,
      };
    }),

  // Update employee (admin only - updates same record)
  updateByAdmin: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        vendorId: z.string(),
        name: z.string().min(1, "Name is required"),
        job: z.string().min(1, "Job/Role is required"),
        nationalId: z
          .string()
          .regex(/^\d{10}$/, "National ID must be exactly 10 digits"),
        gateIds: z.array(z.string()).optional().nullable(),
        zoneIds: z.array(z.string()).optional().nullable(),
        profilePhotoUrl: z.string().min(1, "Profile photo is required"),
        idCardUrls: z.array(z.string()).optional().nullable(),
        status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Validate employee exists
      const existingEmployee = await ctx.db.employee.findUnique({
        where: { id: input.id },
      });

      if (!existingEmployee || existingEmployee.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Employee not found",
        });
      }

      // Validate gates exist if provided
      if (input.gateIds && input.gateIds.length > 0) {
        const gates = await ctx.db.gate.findMany({
          where: {
            id: { in: input.gateIds },
            deletedAt: null,
          },
        });
        if (gates.length !== input.gateIds.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "One or more selected gates not found",
          });
        }
      }

      // Validate zones exist if provided
      if (input.zoneIds && input.zoneIds.length > 0) {
        const zones = await ctx.db.zone.findMany({
          where: {
            id: { in: input.zoneIds },
            deletedAt: null,
          },
        });
        if (zones.length !== input.zoneIds.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "One or more selected zones not found",
          });
        }
      }

      // Delete existing gate and zone relations
      await ctx.db.employeeGate.deleteMany({
        where: { employeeId: input.id },
      });
      await ctx.db.employeeZone.deleteMany({
        where: { employeeId: input.id },
      });

      // Update employee
      const employee = await ctx.db.employee.update({
        where: { id: input.id },
        data: {
          name: input.name,
          job: input.job,
          nationalId: input.nationalId,
          status: input.status,
          gates: input.gateIds
            ? {
                create: input.gateIds.map((gateId) => ({
                  gateId,
                })),
              }
            : undefined,
          zones: input.zoneIds
            ? {
                create: input.zoneIds.map((zoneId) => ({
                  zoneId,
                })),
              }
            : undefined,
        },
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
          vendor: true,
        },
      });

      // Delete all existing attachments
      await ctx.db.employeeAttachment.deleteMany({
        where: { employeeId: input.id },
      });

      // Create new profile photo attachment
      if (input.profilePhotoUrl) {
        const profileAttachment = await ctx.db.attachment.create({
          data: {
            url: input.profilePhotoUrl,
            mimeType: "image/jpeg",
          },
        });

        await ctx.db.employeeAttachment.create({
          data: {
            employeeId: employee.id,
            attachmentId: profileAttachment.id,
            type: "PROFILE_PHOTO",
          },
        });
      }

      // Create new ID card attachments
      if (input.idCardUrls && input.idCardUrls.length > 0) {
        for (const idCardUrl of input.idCardUrls) {
          const idCardAttachment = await ctx.db.attachment.create({
            data: {
              url: idCardUrl,
              mimeType: "image/jpeg",
            },
          });

          await ctx.db.employeeAttachment.create({
            data: {
              employeeId: employee.id,
              attachmentId: idCardAttachment.id,
              type: "ID_CARD",
            },
          });
        }
      }

      return {
        success: true,
        employee,
      };
    }),

  // Create new version of employee (admin only)
  createNewVersion: protectedProcedure
    .input(
      z.object({
        oldEmployeeId: z.string(),
        name: z.string().min(1, "Name is required"),
        job: z.string().min(1, "Job/Role is required"),
        nationalId: z
          .string()
          .regex(/^\d{10}$/, "National ID must be exactly 10 digits"),
        gateIds: z.array(z.string()).optional().nullable(),
        zoneIds: z.array(z.string()).optional().nullable(),
        profilePhotoUrl: z.string().min(1, "Profile photo is required"),
        idCardUrls: z.array(z.string()).optional().nullable(),
        status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get old employee
      const oldEmployee = await ctx.db.employee.findUnique({
        where: { id: input.oldEmployeeId },
      });

      if (!oldEmployee || oldEmployee.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Employee not found",
        });
      }

      // Validate gates exist if provided
      if (input.gateIds && input.gateIds.length > 0) {
        const gates = await ctx.db.gate.findMany({
          where: {
            id: { in: input.gateIds },
            deletedAt: null,
          },
        });
        if (gates.length !== input.gateIds.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "One or more selected gates not found",
          });
        }
      }

      // Validate zones exist if provided
      if (input.zoneIds && input.zoneIds.length > 0) {
        const zones = await ctx.db.zone.findMany({
          where: {
            id: { in: input.zoneIds },
            deletedAt: null,
          },
        });
        if (zones.length !== input.zoneIds.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "One or more selected zones not found",
          });
        }
      }

      // Soft delete old employee
      await ctx.db.employee.update({
        where: { id: input.oldEmployeeId },
        data: { deletedAt: new Date() },
      });

      // Create new employee with same identifier but incremented version
      const newEmployee = await ctx.db.employee.create({
        data: {
          identifier: oldEmployee.identifier, // Keep same identifier
          version: oldEmployee.version + 1, // Increment version
          name: input.name,
          job: input.job,
          nationalId: input.nationalId,
          vendorId: oldEmployee.vendorId,
          status: input.status,
          gates: input.gateIds
            ? {
                create: input.gateIds.map((gateId) => ({
                  gateId,
                })),
              }
            : undefined,
          zones: input.zoneIds
            ? {
                create: input.zoneIds.map((zoneId) => ({
                  zoneId,
                })),
              }
            : undefined,
        },
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
          vendor: true,
        },
      });

      // Create attachments for new version
      if (input.profilePhotoUrl) {
        const profileAttachment = await ctx.db.attachment.create({
          data: {
            url: input.profilePhotoUrl,
            mimeType: "image/jpeg",
          },
        });

        await ctx.db.employeeAttachment.create({
          data: {
            employeeId: newEmployee.id,
            attachmentId: profileAttachment.id,
            type: "PROFILE_PHOTO",
          },
        });
      }

      // Create ID card attachments
      if (input.idCardUrls && input.idCardUrls.length > 0) {
        for (const idCardUrl of input.idCardUrls) {
          const idCardAttachment = await ctx.db.attachment.create({
            data: {
              url: idCardUrl,
              mimeType: "image/jpeg",
            },
          });

          await ctx.db.employeeAttachment.create({
            data: {
              employeeId: newEmployee.id,
              attachmentId: idCardAttachment.id,
              type: "ID_CARD",
            },
          });
        }
      }

      return {
        success: true,
        employee: newEmployee,
        message: `Created version ${newEmployee.version} of employee`,
      };
    }),

  // Delete employee (admin only)
  deleteByAdmin: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const employee = await ctx.db.employee.findUnique({
        where: { id: input.id },
      });

      if (!employee || employee.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Employee not found",
        });
      }

      await ctx.db.employee.update({
        where: { id: input.id },
        data: {
          deletedAt: new Date(),
        },
      });

      return {
        success: true,
        message: "Employee deleted successfully",
      };
    }),

  // Update employee status (admin only)
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const employee = await ctx.db.employee.findUnique({
        where: { id: input.id },
      });

      if (!employee || employee.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Employee not found",
        });
      }

      await ctx.db.employee.update({
        where: { id: input.id },
        data: {
          status: input.status,
        },
      });

      return {
        success: true,
        message: "Employee status updated successfully",
      };
    }),

  // Bulk activate all pending employees for a vendor (admin only)
  bulkActivatePending: protectedProcedure
    .input(
      z.object({
        vendorId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.employee.updateMany({
        where: {
          vendorId: input.vendorId,
          status: "PENDING",
          deletedAt: null,
        },
        data: {
          status: "ACTIVE",
        },
      });

      return {
        success: true,
        count: result.count,
        message: `Activated ${result.count} pending employee(s)`,
      };
    }),
});
