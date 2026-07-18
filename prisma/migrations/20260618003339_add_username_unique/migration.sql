/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'ADMIN';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserState" ADD VALUE 'BANNED';
ALTER TYPE "UserState" ADD VALUE 'INACTIVE';

-- AlterTable
ALTER TABLE "user_auth" ADD COLUMN     "refresh_token" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");
