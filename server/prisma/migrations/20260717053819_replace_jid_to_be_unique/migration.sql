/*
  Warnings:

  - A unique constraint covering the columns `[jid]` on the table `profiles` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "profiles_jid_key" ON "profiles"("jid");
