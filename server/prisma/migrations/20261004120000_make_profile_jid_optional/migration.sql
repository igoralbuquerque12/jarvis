-- AlterTable
ALTER TABLE "profiles" ALTER COLUMN "jid" DROP NOT NULL;

-- Profiles created at signup used the account e-mail as a jid placeholder;
-- unpaired profiles now keep jid NULL until the WhatsApp token handshake.
UPDATE "profiles" AS p
SET "jid" = NULL
FROM "user" AS u
WHERE p."userId" = u."id"
  AND p."jid" = u."email";
