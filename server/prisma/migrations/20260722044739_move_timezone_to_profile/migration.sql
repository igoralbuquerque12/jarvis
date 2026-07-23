-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo';

-- Preserve the timezone from the most recently updated event series of each profile.
UPDATE "profiles" AS "profile"
SET "timezone" = "series"."timezone"
FROM (
    SELECT DISTINCT ON ("profileId") "profileId", "timezone"
    FROM "event_series"
    ORDER BY "profileId", "updatedAt" DESC
) AS "series"
WHERE "profile"."id" = "series"."profileId";

-- AlterTable
ALTER TABLE "event_series" DROP COLUMN "timezone";
