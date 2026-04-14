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
ALTER TABLE "ChatSpace" ADD COLUMN IF NOT EXISTS     "archivedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS     "defaultThreadType" "ChatThreadType" NOT NULL DEFAULT 'CHANNEL',
ADD COLUMN IF NOT EXISTS     "description" TEXT,
ADD COLUMN IF NOT EXISTS     "icon" TEXT,
ADD COLUMN IF NOT EXISTS     "type" "ChatSpaceType" NOT NULL DEFAULT 'COURSE_FORUM';

-- AlterTable
ALTER TABLE "ChatThread" ADD COLUMN IF NOT EXISTS     "pinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS     "resolvedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Resume" ADD COLUMN IF NOT EXISTS     "introVideoEmbedUrl" TEXT,
ADD COLUMN IF NOT EXISTS     "introVideoUrl" TEXT,
ADD COLUMN IF NOT EXISTS     "shareSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Resume_shareSlug_key" ON "Resume"("shareSlug");
