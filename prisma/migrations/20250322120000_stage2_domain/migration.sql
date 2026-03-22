-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "WorkflowRunStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Tenant" ADD COLUMN "createdBy" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "updatedBy" TEXT;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Employee" ADD COLUMN "managerId" TEXT;
ALTER TABLE "Employee" ADD COLUMN "createdBy" TEXT;
ALTER TABLE "Employee" ADD COLUMN "updatedBy" TEXT;

-- AlterTable
ALTER TABLE "WorkflowRun" RENAME COLUMN "status" TO "statusLegacy";
ALTER TABLE "WorkflowRun" ADD COLUMN "status" "WorkflowRunStatus" NOT NULL DEFAULT 'PENDING';
UPDATE "WorkflowRun" SET "status" = 'PENDING' WHERE "statusLegacy" IS NOT NULL;
ALTER TABLE "WorkflowRun" DROP COLUMN "statusLegacy";

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN "actorType" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "correlationId" TEXT;

-- CreateIndex
CREATE INDEX "AuditLog_correlationId_idx" ON "AuditLog"("correlationId");

-- CreateIndex
CREATE INDEX "Employee_managerId_idx" ON "Employee"("managerId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
