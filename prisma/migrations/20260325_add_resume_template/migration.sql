-- AlterTable
ALTER TABLE "Resume" ADD COLUMN IF NOT EXISTS "template" text NOT NULL DEFAULT 'modern';
