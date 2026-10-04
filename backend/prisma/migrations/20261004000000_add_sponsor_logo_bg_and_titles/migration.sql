-- Sponsor logo background colors and per-event sponsor section titles.
ALTER TABLE "sponsor" ADD COLUMN "logoBgColor" TEXT,
ADD COLUMN "logoDarkBgColor" TEXT;

ALTER TABLE "event" ADD COLUMN "sponsorTitles" JSONB;
