-- CreateEnum
CREATE TYPE "PerformanceStatus" AS ENUM ('upcoming', 'cancelled');

-- CreateTable
CREATE TABLE "troupe_members" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "troupe_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performances" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "time" TIME,
    "location" TEXT NOT NULL,
    "notes" TEXT,
    "status" "PerformanceStatus" NOT NULL DEFAULT 'upcoming',
    "createdByMemberId" TEXT NOT NULL,
    "lastUpdatedByMemberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "troupe_members_phoneNumber_key" ON "troupe_members"("phoneNumber");

-- CreateIndex
CREATE INDEX "performances_date_idx" ON "performances"("date");

-- CreateIndex
CREATE INDEX "performances_status_idx" ON "performances"("status");

-- AddForeignKey
ALTER TABLE "performances" ADD CONSTRAINT "performances_createdByMemberId_fkey" FOREIGN KEY ("createdByMemberId") REFERENCES "troupe_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performances" ADD CONSTRAINT "performances_lastUpdatedByMemberId_fkey" FOREIGN KEY ("lastUpdatedByMemberId") REFERENCES "troupe_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
