-- Admin check-in: marks that an attendee has arrived at the event.
ALTER TABLE "registration" ADD COLUMN "checkedIn" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "registration" ADD COLUMN "checkedInAt" TIMESTAMP(3);

CREATE INDEX "registration_eventId_checkedIn_idx" ON "registration"("eventId", "checkedIn");
