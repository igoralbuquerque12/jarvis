-- CreateEnum
CREATE TYPE "HealthCheckHttpMethod" AS ENUM ('GET', 'POST');

-- CreateTable
CREATE TABLE "health_check_configs" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "httpMethod" "HealthCheckHttpMethod" NOT NULL,
    "endpoint" TEXT NOT NULL DEFAULT '',
    "authKey" TEXT,
    "authValue" TEXT,
    "alertMessage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_check_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "health_check_configs_profileId_idx" ON "health_check_configs"("profileId");

-- AddForeignKey
ALTER TABLE "health_check_configs" ADD CONSTRAINT "health_check_configs_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

