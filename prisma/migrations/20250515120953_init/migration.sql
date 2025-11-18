-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('VIEW_AUDIT_LOGS', 'VIEW_DASHBOARD', 'VIEW_REPORTS', 'UPDATE_SETTINGS', 'VIEW_USERS', 'CREATE_USER', 'UPDATE_USER', 'DELETE_USER', 'VIEW_ROLES', 'CREATE_ROLE', 'UPDATE_ROLE', 'DELETE_ROLE');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'COMPANY', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "RequestMethod" AS ENUM ('GET', 'POST', 'PUT', 'DELETE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "SettingType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'DATE');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'IQD');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('PAID', 'NOT_PAID');

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL,
    "en" TEXT NOT NULL,
    "ar" TEXT,
    "ckb" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "name" TEXT,
    "size" DOUBLE PRECISION,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kurdishName" TEXT,
    "arabicName" TEXT,
    "permissions" "Permission"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "userType" "UserType" NOT NULL DEFAULT 'EMPLOYEE',
    "lastLoginDateAndTime" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "ipAddresses" TEXT[],
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bypassOTP" BOOLEAN NOT NULL DEFAULT true,
    "token" TEXT,
    "roleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" JSONB,
    "path" TEXT,
    "method" "RequestMethod" NOT NULL DEFAULT 'UNKNOWN',
    "status" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "duration" INTEGER,
    "requestId" TEXT,
    "correlationId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" "SettingType" NOT NULL DEFAULT 'STRING',
    "isLocked" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Role_deletedAt_idx" ON "Role"("deletedAt");

-- CreateIndex
CREATE INDEX "Role_createdAt_idx" ON "Role"("createdAt");

-- CreateIndex
CREATE INDEX "Role_updatedAt_idx" ON "Role"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_updatedAt_idx" ON "User"("updatedAt");

-- CreateIndex
CREATE INDEX "AuditLog_deletedAt_idx" ON "AuditLog"("deletedAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_updatedAt_idx" ON "AuditLog"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- CreateIndex
CREATE INDEX "Setting_deletedAt_idx" ON "Setting"("deletedAt");

-- CreateIndex
CREATE INDEX "Setting_createdAt_idx" ON "Setting"("createdAt");

-- CreateIndex
CREATE INDEX "Setting_updatedAt_idx" ON "Setting"("updatedAt");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
