/*
  Warnings:

  - A unique constraint covering the columns `[shareSlug]` on the table `Resume` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ChatSpaceType" AS ENUM ('COURSE_FORUM', 'COMMUNITY_LOUNGE', 'DIRECT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ChatThreadType" ADD VALUE 'FORUM';
ALTER TYPE "ChatThreadType" ADD VALUE 'STREAM';

-- AlterTable
ALTER TABLE "ChatSpace" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "defaultThreadType" "ChatThreadType" NOT NULL DEFAULT 'CHANNEL',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "type" "ChatSpaceType" NOT NULL DEFAULT 'COURSE_FORUM';

-- AlterTable
ALTER TABLE "ChatThread" ADD COLUMN     "pinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "introVideoEmbedUrl" TEXT,
ADD COLUMN     "introVideoUrl" TEXT,
ADD COLUMN     "shareSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Resume_shareSlug_key" ON "Resume"("shareSlug");
