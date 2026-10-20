-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN "plan" INTEGER;

-- Number existing rows from 1, Free Tier first, then by creation order.
UPDATE "subscriptions" AS s
SET "plan" = numbered."plan"
FROM (
  SELECT "id",
         ROW_NUMBER() OVER (ORDER BY ("name" = 'Free Tier') DESC, "createdAt", "id") AS "plan"
  FROM "subscriptions"
) AS numbered
WHERE s."id" = numbered."id";

ALTER TABLE "subscriptions" ALTER COLUMN "plan" SET NOT NULL;
ALTER TABLE "subscriptions" DROP COLUMN "limit";

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_plan_key" ON "subscriptions"("plan");
