-- CreateEnum
CREATE TYPE "IntegrationKind" AS ENUM ('EMAIL', 'CALENDAR');

-- AlterTable
ALTER TABLE "IntegrationConnection" ADD COLUMN "kind" "IntegrationKind" NOT NULL DEFAULT 'EMAIL';
ALTER TABLE "IntegrationConnection" ADD COLUMN "employeeId" TEXT;

-- AddForeignKey
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "IntegrationConnection_tenantId_employeeId_idx" ON "IntegrationConnection"("tenantId", "employeeId");
CREATE INDEX "IntegrationConnection_tenantId_kind_idx" ON "IntegrationConnection"("tenantId", "kind");

-- Unique Telegram user id per bot user (one Wilson account per Telegram account)
CREATE UNIQUE INDEX "TelegramBinding_telegramUserId_key" ON "TelegramBinding"("telegramUserId");
