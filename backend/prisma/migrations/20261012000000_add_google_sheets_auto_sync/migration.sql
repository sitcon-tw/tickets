-- Google Sheets auto-sync: keep an event's export sheet updated as registrations change.
ALTER TABLE "event" ADD COLUMN "googleSheetsAutoSync" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "event" ADD COLUMN "googleSheetsSyncedAt" TIMESTAMP(3);
ALTER TABLE "event" ADD COLUMN "googleSheetsSyncError" TEXT;
ALTER TABLE "event" ADD COLUMN "googleSheetsSyncFingerprint" TEXT;
