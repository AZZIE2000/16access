import { PrismaClient, Role } from "../generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Hash password
  const hashedPassword = await bcrypt.hash("admin123", 10);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      name: "Admin User",
      username: "admin",
      email: "admin@example.com",
      role: Role.admin,
      password: hashedPassword,
    },
  });

  console.log("✅ Created admin user:", {
    username: admin.username,
    email: admin.email,
    role: admin.role,
  });

  // Create usher user
  const usherPassword = await bcrypt.hash("usher123", 10);
  const usher = await prisma.user.upsert({
    where: { username: "usher" },
    update: {},
    create: {
      name: "Usher User",
      username: "usher",
      email: "usher@example.com",
      role: Role.usher,
      password: usherPassword,
    },
  });

  console.log("✅ Created usher user:", {
    username: usher.username,
    email: usher.email,
    role: usher.role,
  });

  console.log("\n🎉 Seeding completed!");
  console.log("\nTest credentials:");
  console.log("Admin - username: admin, password: admin123");
  console.log("Usher - username: usher, password: usher123");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

