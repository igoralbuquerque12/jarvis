-- CreateEnum
CREATE TYPE "MessageContentType" AS ENUM ('TEXT', 'AUDIO');

-- AlterTable
ALTER TABLE "messages" ADD COLUMN "contentType" "MessageContentType" NOT NULL DEFAULT 'TEXT';
