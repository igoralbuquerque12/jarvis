-- CreateEnum
CREATE TYPE "AssistantRunStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "messages" ADD COLUMN "runId" UUID;

-- CreateTable
CREATE TABLE "assistant_runs" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "waMessageId" TEXT NOT NULL,
    "status" "AssistantRunStatus" NOT NULL DEFAULT 'PROCESSING',
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "assistant_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "messages_runId_idx" ON "messages"("runId");

-- CreateIndex
CREATE INDEX "assistant_runs_status_startedAt_idx" ON "assistant_runs"("status", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "assistant_runs_profileId_waMessageId_key" ON "assistant_runs"("profileId", "waMessageId");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_runId_fkey" FOREIGN KEY ("runId") REFERENCES "assistant_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_runs" ADD CONSTRAINT "assistant_runs_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
