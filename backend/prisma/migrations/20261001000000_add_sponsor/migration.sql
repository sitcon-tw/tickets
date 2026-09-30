-- Sponsor logos shown on the event page.
CREATE TABLE "sponsor" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "name" JSONB NOT NULL,
    "description" JSONB,
    "logoUrl" TEXT NOT NULL,
    "logoDarkUrl" TEXT,
    "websiteUrl" TEXT,
    "placements" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsor_pkey" PRIMARY KEY ("id")
);

-- Daily impression / click counters per sponsor and placement.
CREATE TABLE "sponsor_stat" (
    "sponsorId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "placement" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "linkClicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sponsor_stat_pkey" PRIMARY KEY ("sponsorId","date","placement")
);

-- CreateIndex
CREATE INDEX "sponsor_eventId_order_idx" ON "sponsor"("eventId", "order");

-- AddForeignKey
ALTER TABLE "sponsor" ADD CONSTRAINT "sponsor_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsor_stat" ADD CONSTRAINT "sponsor_stat_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "sponsor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
