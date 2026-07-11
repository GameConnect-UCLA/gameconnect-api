-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('DIRECT', 'GROUP');

-- AlterTable
ALTER TABLE "conversation" ADD COLUMN     "type" "ConversationType" NOT NULL DEFAULT 'DIRECT';
