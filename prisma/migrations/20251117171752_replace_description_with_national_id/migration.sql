/*
 Warnings:
 
 - You are about to drop the column `description` on the `Employee` table. All the data in the column will be lost.
 - Added the required column `nationalId` to the `Employee` table without a default value. This is not possible if the table is not empty.
 
 */
-- AlterTable: Add nationalId column with a temporary default value
ALTER TABLE
  "Employee"
ADD
  COLUMN "nationalId" TEXT NOT NULL DEFAULT '0000000000';

-- Update existing rows with a placeholder national ID (you may want to update these manually later)
UPDATE
  "Employee"
SET
  "nationalId" = '0000000000'
WHERE
  "nationalId" = '0000000000';

-- Remove the default value so future inserts require nationalId
ALTER TABLE
  "Employee"
ALTER COLUMN
  "nationalId" DROP DEFAULT;

-- Drop the description column
ALTER TABLE
  "Employee" DROP COLUMN "description";

-- CreateIndex
CREATE INDEX "Employee_nationalId_idx" ON "Employee"("nationalId");