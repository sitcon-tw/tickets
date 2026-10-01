-- Admin-defined roles made of fine-grained permissions.
CREATE TABLE "role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT NOT NULL,
    "allEvents" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- A user with role = 'custom' takes its permissions from this role.
ALTER TABLE "user" ADD COLUMN "roleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "role_name_key" ON "role"("name");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
