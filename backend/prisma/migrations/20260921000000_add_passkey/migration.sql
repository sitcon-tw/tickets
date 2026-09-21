-- Passkey (WebAuthn) credentials managed by the better-auth passkey plugin.
CREATE TABLE "passkey" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "publicKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialID" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "deviceType" TEXT NOT NULL,
    "backedUp" BOOLEAN NOT NULL,
    "transports" TEXT,
    "aaguid" TEXT,
    "createdAt" TIMESTAMP(3),

    CONSTRAINT "passkey_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "passkey_userId_idx" ON "passkey"("userId");

CREATE INDEX "passkey_credentialID_idx" ON "passkey"("credentialID");

ALTER TABLE "passkey"
ADD CONSTRAINT "passkey_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "user"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
