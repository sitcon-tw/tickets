-- Site-wide key/value settings.
CREATE TABLE "site_setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_setting_pkey" PRIMARY KEY ("key")
);
