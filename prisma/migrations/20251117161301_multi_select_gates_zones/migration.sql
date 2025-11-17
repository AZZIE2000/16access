/*
  Warnings:

  - You are about to drop the column `gateId` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `zoneId` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `gateId` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `zoneId` on the `Vendor` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_gateId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "Vendor" DROP CONSTRAINT "Vendor_gateId_fkey";

-- DropForeignKey
ALTER TABLE "Vendor" DROP CONSTRAINT "Vendor_zoneId_fkey";

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "gateId",
DROP COLUMN "zoneId";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "password" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Vendor" DROP COLUMN "gateId",
DROP COLUMN "zoneId";

-- CreateTable
CREATE TABLE "VendorGate" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "gateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorGate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorZone" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeGate" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "gateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeGate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeZone" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeZone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VendorGate_vendorId_idx" ON "VendorGate"("vendorId");

-- CreateIndex
CREATE INDEX "VendorGate_gateId_idx" ON "VendorGate"("gateId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorGate_vendorId_gateId_key" ON "VendorGate"("vendorId", "gateId");

-- CreateIndex
CREATE INDEX "VendorZone_vendorId_idx" ON "VendorZone"("vendorId");

-- CreateIndex
CREATE INDEX "VendorZone_zoneId_idx" ON "VendorZone"("zoneId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorZone_vendorId_zoneId_key" ON "VendorZone"("vendorId", "zoneId");

-- CreateIndex
CREATE INDEX "EmployeeGate_employeeId_idx" ON "EmployeeGate"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeGate_gateId_idx" ON "EmployeeGate"("gateId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeGate_employeeId_gateId_key" ON "EmployeeGate"("employeeId", "gateId");

-- CreateIndex
CREATE INDEX "EmployeeZone_employeeId_idx" ON "EmployeeZone"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeZone_zoneId_idx" ON "EmployeeZone"("zoneId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeZone_employeeId_zoneId_key" ON "EmployeeZone"("employeeId", "zoneId");

-- AddForeignKey
ALTER TABLE "VendorGate" ADD CONSTRAINT "VendorGate_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorGate" ADD CONSTRAINT "VendorGate_gateId_fkey" FOREIGN KEY ("gateId") REFERENCES "Gate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorZone" ADD CONSTRAINT "VendorZone_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorZone" ADD CONSTRAINT "VendorZone_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeGate" ADD CONSTRAINT "EmployeeGate_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeGate" ADD CONSTRAINT "EmployeeGate_gateId_fkey" FOREIGN KEY ("gateId") REFERENCES "Gate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeZone" ADD CONSTRAINT "EmployeeZone_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeZone" ADD CONSTRAINT "EmployeeZone_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
