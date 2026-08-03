-- CreateEnum
CREATE TYPE "EventSeriesType" AS ENUM ('UNIQUE', 'RECURRENCE');

-- CreateEnum
CREATE TYPE "RecurrenceMode" AS ENUM ('HOUR', 'DAY', 'WEEK', 'MONTH');

-- CreateEnum
CREATE TYPE "EventExecutionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "event_series" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "type" "EventSeriesType" NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "recurrenceInterval" INTEGER,
    "recurrenceMode" "RecurrenceMode",
    "timezone" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_executions" (
    "id" UUID NOT NULL,
    "eventSeriesId" UUID NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "status" "EventExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "observabilitys" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_series_profileId_idx" ON "event_series"("profileId");

-- CreateIndex
CREATE INDEX "event_executions_status_scheduledAt_idx" ON "event_executions"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "event_executions_eventSeriesId_idx" ON "event_executions"("eventSeriesId");

-- CreateIndex
CREATE UNIQUE INDEX "event_executions_eventSeriesId_scheduledAt_key" ON "event_executions"("eventSeriesId", "scheduledAt");

-- AddForeignKey
ALTER TABLE "event_series" ADD CONSTRAINT "event_series_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_executions" ADD CONSTRAINT "event_executions_eventSeriesId_fkey" FOREIGN KEY ("eventSeriesId") REFERENCES "event_series"("id") ON DELETE CASCADE ON UPDATE CASCADE;
