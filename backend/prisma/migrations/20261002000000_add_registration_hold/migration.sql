-- Pending registrations hold a seat until holdExpiresAt; expired holds are released.
ALTER TABLE "registration" ADD COLUMN "holdExpiresAt" TIMESTAMP(3);

CREATE INDEX "registration_status_holdExpiresAt_idx" ON "registration"("status", "holdExpiresAt");
