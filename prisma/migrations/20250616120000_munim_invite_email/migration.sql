-- AlterTable: MunimInvite email-based invites for pilot
ALTER TABLE "munim_invites" DROP CONSTRAINT IF EXISTS "munim_invites_firm_id_phone_key";

ALTER TABLE "munim_invites" ADD COLUMN IF NOT EXISTS "email" TEXT;

UPDATE "munim_invites" SET "email" = CONCAT('legacy+', "phone", '@placeholder.local') WHERE "email" IS NULL;

ALTER TABLE "munim_invites" ALTER COLUMN "email" SET NOT NULL;

ALTER TABLE "munim_invites" ALTER COLUMN "phone" DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "munim_invites_firm_id_email_key" ON "munim_invites"("firm_id", "email");
