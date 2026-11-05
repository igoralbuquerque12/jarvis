-- CreateTable
CREATE TABLE "database_informations" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "database_informations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "database_informations_profileId_idx" ON "database_informations"("profileId");

-- AddForeignKey
ALTER TABLE "database_informations" ADD CONSTRAINT "database_informations_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
