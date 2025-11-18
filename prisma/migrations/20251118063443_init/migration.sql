/*
  Warnings:

  - The values [COMPANY] on the enum `UserType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "TransportServiceType" AS ENUM ('BUS', 'MINIBUS', 'TAXI', 'SHARED_TAXI', 'OTHER');

-- CreateEnum
CREATE TYPE "RouteDirection" AS ENUM ('OUTBOUND', 'INBOUND', 'CIRCULAR', 'BIDIRECTIONAL');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Permission" ADD VALUE 'VIEW_TRANSPORT_SERVICES';
ALTER TYPE "Permission" ADD VALUE 'CREATE_TRANSPORT_SERVICE';
ALTER TYPE "Permission" ADD VALUE 'UPDATE_TRANSPORT_SERVICE';
ALTER TYPE "Permission" ADD VALUE 'DELETE_TRANSPORT_SERVICE';
ALTER TYPE "Permission" ADD VALUE 'VIEW_BUS_STOPS';
ALTER TYPE "Permission" ADD VALUE 'CREATE_BUS_STOP';
ALTER TYPE "Permission" ADD VALUE 'UPDATE_BUS_STOP';
ALTER TYPE "Permission" ADD VALUE 'DELETE_BUS_STOP';
ALTER TYPE "Permission" ADD VALUE 'VIEW_BUS_LANES';
ALTER TYPE "Permission" ADD VALUE 'CREATE_BUS_LANE';
ALTER TYPE "Permission" ADD VALUE 'UPDATE_BUS_LANE';
ALTER TYPE "Permission" ADD VALUE 'DELETE_BUS_LANE';
ALTER TYPE "Permission" ADD VALUE 'VIEW_BUS_ROUTES';
ALTER TYPE "Permission" ADD VALUE 'CREATE_BUS_ROUTE';
ALTER TYPE "Permission" ADD VALUE 'UPDATE_BUS_ROUTE';
ALTER TYPE "Permission" ADD VALUE 'DELETE_BUS_ROUTE';
ALTER TYPE "Permission" ADD VALUE 'VIEW_MAP_ICONS';
ALTER TYPE "Permission" ADD VALUE 'CREATE_MAP_ICON';
ALTER TYPE "Permission" ADD VALUE 'UPDATE_MAP_ICON';
ALTER TYPE "Permission" ADD VALUE 'DELETE_MAP_ICON';
ALTER TYPE "Permission" ADD VALUE 'VIEW_ZONES';
ALTER TYPE "Permission" ADD VALUE 'CREATE_ZONE';
ALTER TYPE "Permission" ADD VALUE 'UPDATE_ZONE';
ALTER TYPE "Permission" ADD VALUE 'DELETE_ZONE';
ALTER TYPE "Permission" ADD VALUE 'VIEW_BUS_SCHEDULES';
ALTER TYPE "Permission" ADD VALUE 'CREATE_BUS_SCHEDULE';
ALTER TYPE "Permission" ADD VALUE 'UPDATE_BUS_SCHEDULE';
ALTER TYPE "Permission" ADD VALUE 'DELETE_BUS_SCHEDULE';
ALTER TYPE "Permission" ADD VALUE 'VIEW_MAP_EDITOR';
ALTER TYPE "Permission" ADD VALUE 'EDIT_MAP';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SettingType" ADD VALUE 'IMAGE';
ALTER TYPE "SettingType" ADD VALUE 'VIDEO';
ALTER TYPE "SettingType" ADD VALUE 'AUDIO';
ALTER TYPE "SettingType" ADD VALUE 'DOCUMENT';
ALTER TYPE "SettingType" ADD VALUE 'OTHER';

-- AlterEnum
BEGIN;
CREATE TYPE "UserType_new" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'CLIENT');
ALTER TABLE "User" ALTER COLUMN "userType" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "userType" TYPE "UserType_new" USING ("userType"::text::"UserType_new");
ALTER TYPE "UserType" RENAME TO "UserType_old";
ALTER TYPE "UserType_new" RENAME TO "UserType";
DROP TYPE "UserType_old";
ALTER TABLE "User" ALTER COLUMN "userType" SET DEFAULT 'EMPLOYEE';
COMMIT;

-- CreateTable
CREATE TABLE "MapIcon" (
    "id" TEXT NOT NULL,
    "nameId" TEXT,
    "descriptionId" TEXT,
    "fileId" TEXT NOT NULL,
    "iconSize" INTEGER DEFAULT 32,
    "iconAnchorX" INTEGER DEFAULT 16,
    "iconAnchorY" INTEGER DEFAULT 32,
    "popupAnchorX" INTEGER DEFAULT 0,
    "popupAnchorY" INTEGER DEFAULT -32,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MapIcon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL,
    "nameId" TEXT,
    "descriptionId" TEXT,
    "color" TEXT DEFAULT '#FF6B6B',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportService" (
    "id" TEXT NOT NULL,
    "type" "TransportServiceType" NOT NULL DEFAULT 'BUS',
    "nameId" TEXT,
    "descriptionId" TEXT,
    "color" TEXT DEFAULT '#0066CC',
    "iconId" TEXT,
    "capacity" INTEGER,
    "operatingFrom" TEXT,
    "operatingTo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TransportService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusStop" (
    "id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "nameId" TEXT,
    "descriptionId" TEXT,
    "iconId" TEXT,
    "zoneId" TEXT,
    "hasShelter" BOOLEAN NOT NULL DEFAULT false,
    "hasBench" BOOLEAN NOT NULL DEFAULT false,
    "hasLighting" BOOLEAN NOT NULL DEFAULT false,
    "isAccessible" BOOLEAN NOT NULL DEFAULT false,
    "hasRealTimeInfo" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "BusStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusLane" (
    "id" TEXT NOT NULL,
    "path" JSONB NOT NULL,
    "nameId" TEXT,
    "descriptionId" TEXT,
    "color" TEXT NOT NULL DEFAULT '#0066CC',
    "weight" INTEGER NOT NULL DEFAULT 5,
    "opacity" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "serviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "BusLane_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusRoute" (
    "id" TEXT NOT NULL,
    "nameId" TEXT,
    "descriptionId" TEXT,
    "serviceId" TEXT,
    "routeNumber" TEXT,
    "direction" "RouteDirection" NOT NULL DEFAULT 'BIDIRECTIONAL',
    "fare" DOUBLE PRECISION,
    "currency" "Currency" NOT NULL DEFAULT 'IQD',
    "frequency" INTEGER,
    "duration" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "BusRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusSchedule" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "stopId" TEXT NOT NULL,
    "departureTime" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "specificDate" TIMESTAMP(3),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "BusSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BusStopToFile" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BusStopToFile_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_BusLaneToFile" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BusLaneToFile_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_BusLaneToBusStop" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BusLaneToBusStop_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_BusLaneToBusRoute" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BusLaneToBusRoute_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_BusRouteToBusStop" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BusRouteToBusStop_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "MapIcon_deletedAt_idx" ON "MapIcon"("deletedAt");

-- CreateIndex
CREATE INDEX "MapIcon_createdAt_idx" ON "MapIcon"("createdAt");

-- CreateIndex
CREATE INDEX "MapIcon_updatedAt_idx" ON "MapIcon"("updatedAt");

-- CreateIndex
CREATE INDEX "MapIcon_fileId_idx" ON "MapIcon"("fileId");

-- CreateIndex
CREATE INDEX "Zone_deletedAt_idx" ON "Zone"("deletedAt");

-- CreateIndex
CREATE INDEX "Zone_createdAt_idx" ON "Zone"("createdAt");

-- CreateIndex
CREATE INDEX "Zone_updatedAt_idx" ON "Zone"("updatedAt");

-- CreateIndex
CREATE INDEX "TransportService_deletedAt_idx" ON "TransportService"("deletedAt");

-- CreateIndex
CREATE INDEX "TransportService_createdAt_idx" ON "TransportService"("createdAt");

-- CreateIndex
CREATE INDEX "TransportService_updatedAt_idx" ON "TransportService"("updatedAt");

-- CreateIndex
CREATE INDEX "TransportService_type_idx" ON "TransportService"("type");

-- CreateIndex
CREATE INDEX "TransportService_iconId_idx" ON "TransportService"("iconId");

-- CreateIndex
CREATE INDEX "BusStop_deletedAt_idx" ON "BusStop"("deletedAt");

-- CreateIndex
CREATE INDEX "BusStop_createdAt_idx" ON "BusStop"("createdAt");

-- CreateIndex
CREATE INDEX "BusStop_updatedAt_idx" ON "BusStop"("updatedAt");

-- CreateIndex
CREATE INDEX "BusStop_latitude_longitude_idx" ON "BusStop"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "BusStop_iconId_idx" ON "BusStop"("iconId");

-- CreateIndex
CREATE INDEX "BusStop_zoneId_idx" ON "BusStop"("zoneId");

-- CreateIndex
CREATE INDEX "BusLane_deletedAt_idx" ON "BusLane"("deletedAt");

-- CreateIndex
CREATE INDEX "BusLane_createdAt_idx" ON "BusLane"("createdAt");

-- CreateIndex
CREATE INDEX "BusLane_updatedAt_idx" ON "BusLane"("updatedAt");

-- CreateIndex
CREATE INDEX "BusLane_serviceId_idx" ON "BusLane"("serviceId");

-- CreateIndex
CREATE INDEX "BusRoute_deletedAt_idx" ON "BusRoute"("deletedAt");

-- CreateIndex
CREATE INDEX "BusRoute_createdAt_idx" ON "BusRoute"("createdAt");

-- CreateIndex
CREATE INDEX "BusRoute_updatedAt_idx" ON "BusRoute"("updatedAt");

-- CreateIndex
CREATE INDEX "BusRoute_serviceId_idx" ON "BusRoute"("serviceId");

-- CreateIndex
CREATE INDEX "BusRoute_routeNumber_idx" ON "BusRoute"("routeNumber");

-- CreateIndex
CREATE INDEX "BusRoute_direction_idx" ON "BusRoute"("direction");

-- CreateIndex
CREATE INDEX "BusSchedule_deletedAt_idx" ON "BusSchedule"("deletedAt");

-- CreateIndex
CREATE INDEX "BusSchedule_createdAt_idx" ON "BusSchedule"("createdAt");

-- CreateIndex
CREATE INDEX "BusSchedule_updatedAt_idx" ON "BusSchedule"("updatedAt");

-- CreateIndex
CREATE INDEX "BusSchedule_routeId_idx" ON "BusSchedule"("routeId");

-- CreateIndex
CREATE INDEX "BusSchedule_stopId_idx" ON "BusSchedule"("stopId");

-- CreateIndex
CREATE INDEX "BusSchedule_dayOfWeek_idx" ON "BusSchedule"("dayOfWeek");

-- CreateIndex
CREATE INDEX "BusSchedule_departureTime_idx" ON "BusSchedule"("departureTime");

-- CreateIndex
CREATE INDEX "BusSchedule_specificDate_idx" ON "BusSchedule"("specificDate");

-- CreateIndex
CREATE INDEX "_BusStopToFile_B_index" ON "_BusStopToFile"("B");

-- CreateIndex
CREATE INDEX "_BusLaneToFile_B_index" ON "_BusLaneToFile"("B");

-- CreateIndex
CREATE INDEX "_BusLaneToBusStop_B_index" ON "_BusLaneToBusStop"("B");

-- CreateIndex
CREATE INDEX "_BusLaneToBusRoute_B_index" ON "_BusLaneToBusRoute"("B");

-- CreateIndex
CREATE INDEX "_BusRouteToBusStop_B_index" ON "_BusRouteToBusStop"("B");

-- AddForeignKey
ALTER TABLE "MapIcon" ADD CONSTRAINT "MapIcon_nameId_fkey" FOREIGN KEY ("nameId") REFERENCES "Language"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapIcon" ADD CONSTRAINT "MapIcon_descriptionId_fkey" FOREIGN KEY ("descriptionId") REFERENCES "Language"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapIcon" ADD CONSTRAINT "MapIcon_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_nameId_fkey" FOREIGN KEY ("nameId") REFERENCES "Language"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_descriptionId_fkey" FOREIGN KEY ("descriptionId") REFERENCES "Language"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportService" ADD CONSTRAINT "TransportService_nameId_fkey" FOREIGN KEY ("nameId") REFERENCES "Language"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportService" ADD CONSTRAINT "TransportService_descriptionId_fkey" FOREIGN KEY ("descriptionId") REFERENCES "Language"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportService" ADD CONSTRAINT "TransportService_iconId_fkey" FOREIGN KEY ("iconId") REFERENCES "MapIcon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusStop" ADD CONSTRAINT "BusStop_nameId_fkey" FOREIGN KEY ("nameId") REFERENCES "Language"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusStop" ADD CONSTRAINT "BusStop_descriptionId_fkey" FOREIGN KEY ("descriptionId") REFERENCES "Language"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusStop" ADD CONSTRAINT "BusStop_iconId_fkey" FOREIGN KEY ("iconId") REFERENCES "MapIcon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusStop" ADD CONSTRAINT "BusStop_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusLane" ADD CONSTRAINT "BusLane_nameId_fkey" FOREIGN KEY ("nameId") REFERENCES "Language"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusLane" ADD CONSTRAINT "BusLane_descriptionId_fkey" FOREIGN KEY ("descriptionId") REFERENCES "Language"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusLane" ADD CONSTRAINT "BusLane_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "TransportService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusRoute" ADD CONSTRAINT "BusRoute_nameId_fkey" FOREIGN KEY ("nameId") REFERENCES "Language"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusRoute" ADD CONSTRAINT "BusRoute_descriptionId_fkey" FOREIGN KEY ("descriptionId") REFERENCES "Language"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusRoute" ADD CONSTRAINT "BusRoute_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "TransportService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusSchedule" ADD CONSTRAINT "BusSchedule_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "BusRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusSchedule" ADD CONSTRAINT "BusSchedule_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "BusStop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BusStopToFile" ADD CONSTRAINT "_BusStopToFile_A_fkey" FOREIGN KEY ("A") REFERENCES "BusStop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BusStopToFile" ADD CONSTRAINT "_BusStopToFile_B_fkey" FOREIGN KEY ("B") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BusLaneToFile" ADD CONSTRAINT "_BusLaneToFile_A_fkey" FOREIGN KEY ("A") REFERENCES "BusLane"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BusLaneToFile" ADD CONSTRAINT "_BusLaneToFile_B_fkey" FOREIGN KEY ("B") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BusLaneToBusStop" ADD CONSTRAINT "_BusLaneToBusStop_A_fkey" FOREIGN KEY ("A") REFERENCES "BusLane"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BusLaneToBusStop" ADD CONSTRAINT "_BusLaneToBusStop_B_fkey" FOREIGN KEY ("B") REFERENCES "BusStop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BusLaneToBusRoute" ADD CONSTRAINT "_BusLaneToBusRoute_A_fkey" FOREIGN KEY ("A") REFERENCES "BusLane"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BusLaneToBusRoute" ADD CONSTRAINT "_BusLaneToBusRoute_B_fkey" FOREIGN KEY ("B") REFERENCES "BusRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BusRouteToBusStop" ADD CONSTRAINT "_BusRouteToBusStop_A_fkey" FOREIGN KEY ("A") REFERENCES "BusRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BusRouteToBusStop" ADD CONSTRAINT "_BusRouteToBusStop_B_fkey" FOREIGN KEY ("B") REFERENCES "BusStop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
