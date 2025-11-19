import { z } from "zod";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";
import { Role } from "../../../../generated/prisma";

export const userRouter = createTRPCRouter({
  signup: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        username: z
          .string()
          .min(3, "Username must be at least 3 characters")
          .max(20, "Username must be at most 20 characters")
          .regex(
            /^[a-zA-Z0-9_]+$/,
            "Username can only contain letters, numbers, and underscores",
          ),
        email: z.string().email("Invalid email address"),
        password: z
          .string()
          .min(6, "Password must be at least 6 characters")
          .max(100, "Password must be at most 100 characters"),
        role: z.nativeEnum(Role),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if username already exists
      const existingUsername = await ctx.db.user.findUnique({
        where: { username: input.username },
      });

      if (existingUsername) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username already exists",
        });
      }

      // Check if email already exists
      const existingEmail = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (existingEmail) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already exists",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // Create user
      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          username: input.username,
          email: input.email,
          password: hashedPassword,
          role: input.role,
        },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      return {
        success: true,
        user,
      };
    }),

  // Get all users (admin only)
  getAll: protectedProcedure.query(async ({ ctx }) => {
    // Check if user is admin
    if (ctx.session.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can view users",
      });
    }

    const users = await ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        password: true, // Include to check if set
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Map to include hasPassword flag without exposing the actual password
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      hasPassword: !!user.password,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }),

  // Create user (admin only)
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        username: z
          .string()
          .min(3, "Username must be at least 3 characters")
          .max(20, "Username must be at most 20 characters")
          .regex(
            /^[a-zA-Z0-9_]+$/,
            "Username can only contain letters, numbers, and underscores",
          ),
        email: z.string().email("Invalid email address"),
        role: z.nativeEnum(Role),
        password: z.string().optional(), // Optional password
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can create users",
        });
      }

      // Check if username already exists
      const existingUsername = await ctx.db.user.findUnique({
        where: { username: input.username },
      });

      if (existingUsername) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username already exists",
        });
      }

      // Check if email already exists
      const existingEmail = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (existingEmail) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already exists",
        });
      }

      // Hash password if provided
      let hashedPassword: string | null = null;
      if (input.password) {
        hashedPassword = await bcrypt.hash(input.password, 10);
      }

      // Create user
      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          username: input.username,
          email: input.email,
          password: hashedPassword,
          role: input.role,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      return user;
    }),

  // Update user (admin only)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Name is required").optional(),
        username: z
          .string()
          .min(3, "Username must be at least 3 characters")
          .max(20, "Username must be at most 20 characters")
          .regex(
            /^[a-zA-Z0-9_]+$/,
            "Username can only contain letters, numbers, and underscores",
          )
          .optional(),
        email: z.string().email("Invalid email address").optional(),
        role: z.nativeEnum(Role).optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update users",
        });
      }

      const { id, ...updateData } = input;

      // Check if username already exists (if updating username)
      if (updateData.username) {
        const existingUsername = await ctx.db.user.findFirst({
          where: {
            username: updateData.username,
            NOT: { id },
          },
        });

        if (existingUsername) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Username already exists",
          });
        }
      }

      // Check if email already exists (if updating email)
      if (updateData.email) {
        const existingEmail = await ctx.db.user.findFirst({
          where: {
            email: updateData.email,
            NOT: { id },
          },
        });

        if (existingEmail) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email already exists",
          });
        }
      }

      // Update user
      const user = await ctx.db.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return user;
    }),

  // Set/update password (admin only)
  setPassword: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        password: z
          .string()
          .min(6, "Password must be at least 6 characters")
          .max(100, "Password must be at most 100 characters"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can set passwords",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // Update user password
      await ctx.db.user.update({
        where: { id: input.userId },
        data: { password: hashedPassword },
      });

      return { success: true };
    }),

  // Check if user has password (public - for login flow)
  checkUserPassword: publicProcedure
    .input(
      z.object({
        identifier: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Convert identifier to lowercase for case-insensitive lookup
      const identifierLower = input.identifier.toLowerCase();

      // Find user by username or email (case-insensitive)
      const user = await ctx.db.user.findFirst({
        where: {
          OR: [{ username: identifierLower }, { email: identifierLower }],
        },
        select: {
          id: true,
          username: true,
          password: true,
          isActive: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (!user.isActive) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Account is disabled",
        });
      }

      return {
        hasPassword: !!user.password,
        username: user.username,
      };
    }),

  // Setup password (for users without password)
  setupPassword: publicProcedure
    .input(
      z.object({
        username: z.string(),
        password: z
          .string()
          .min(6, "Password must be at least 6 characters")
          .max(100, "Password must be at most 100 characters"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Find user
      const user = await ctx.db.user.findUnique({
        where: { username: input.username },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Check if user already has a password
      if (user.password) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User already has a password",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // Update user password
      await ctx.db.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      return { success: true };
    }),

  // Delete user (admin only)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can delete users",
        });
      }

      // Prevent deleting yourself
      if (ctx.session.user.id === input.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot delete yourself",
        });
      }

      await ctx.db.user.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
