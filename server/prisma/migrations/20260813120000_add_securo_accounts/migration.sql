-- CreateEnum
CREATE TYPE "SecuroAccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'FAILED');

-- CreateTable
CREATE TABLE "securo_accounts" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "securoUserId" TEXT,
    "workspaceId" TEXT,
    "defaultAccountId" TEXT,
    "status" "SecuroAccountStatus" NOT NULL DEFAULT 'PENDING',
    "observabilitys" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "securo_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "securo_accounts_profileId_key" ON "securo_accounts"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "securo_accounts_email_key" ON "securo_accounts"("email");

-- AddForeignKey
ALTER TABLE "securo_accounts" ADD CONSTRAINT "securo_accounts_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
