-- pgvector: the image (pgvector/pgvector:pg16) ships it; Prisma does not manage
-- extensions, so it is enabled here. The app role is the superuser of its DB.
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "KnowledgeIndexStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "database_informations" ADD COLUMN     "chunkCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "contentHash" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "indexAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "indexError" TEXT,
ADD COLUMN     "indexStartedAt" TIMESTAMP(3),
ADD COLUMN     "indexStatus" "KnowledgeIndexStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "indexedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "knowledge_chunks" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "databaseInformationId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "embeddingModel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_search_logs" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "runId" UUID,
    "query" TEXT NOT NULL,
    "results" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_search_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "knowledge_chunks_profileId_idx" ON "knowledge_chunks"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_chunks_databaseInformationId_position_key" ON "knowledge_chunks"("databaseInformationId", "position");

-- CreateIndex
CREATE INDEX "knowledge_search_logs_profileId_createdAt_idx" ON "knowledge_search_logs"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "database_informations_indexStatus_idx" ON "database_informations"("indexStatus");

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_databaseInformationId_fkey" FOREIGN KEY ("databaseInformationId") REFERENCES "database_informations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_search_logs" ADD CONSTRAINT "knowledge_search_logs_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
