-- Preserve the invitation code used by each registration so cancellation can
-- restore only that code's usage count.
ALTER TABLE "registration" ADD COLUMN "invitationCodeId" TEXT;

CREATE INDEX "registration_invitationCodeId_idx" ON "registration"("invitationCodeId");

ALTER TABLE "registration"
ADD CONSTRAINT "registration_invitationCodeId_fkey"
FOREIGN KEY ("invitationCodeId") REFERENCES "invitation_code"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
