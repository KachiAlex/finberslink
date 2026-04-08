/*
  Warnings:

  - The values [REVIEWING,OFFER] on the enum `JobApplicationStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "InterviewSessionStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InterviewFlowStep" AS ENUM ('QUESTION_PHASE', 'FEEDBACK_PHASE', 'RATING_PHASE');

-- AlterEnum
BEGIN;
CREATE TYPE "JobApplicationStatus_new" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'INTERVIEW', 'OFFERED', 'REJECTED');
ALTER TABLE "JobApplication" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "JobApplication" ALTER COLUMN "status" TYPE "JobApplicationStatus_new" USING ("status"::text::"JobApplicationStatus_new");
ALTER TYPE "JobApplicationStatus" RENAME TO "JobApplicationStatus_old";
ALTER TYPE "JobApplicationStatus_new" RENAME TO "JobApplicationStatus";
DROP TYPE "JobApplicationStatus_old";
ALTER TABLE "JobApplication" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';
COMMIT;

-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "skillAnalysisSnapshot" JSONB;

-- CreateTable
CREATE TABLE "InterviewSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeId" TEXT,
    "jobOpportunityId" TEXT,
    "targetRole" TEXT NOT NULL,
    "status" "InterviewSessionStatus" NOT NULL DEFAULT 'PENDING',
    "currentStep" "InterviewFlowStep" NOT NULL DEFAULT 'QUESTION_PHASE',
    "summary" TEXT,
    "rating" INTEGER,
    "recommendation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewQuestion" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "rubric" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewResponse" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "audioUrl" TEXT,
    "transcript" TEXT NOT NULL,
    "aiFeedback" TEXT,
    "score" DOUBLE PRECISION,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InterviewSession_userId_status_idx" ON "InterviewSession"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewQuestion_sessionId_sequence_key" ON "InterviewQuestion"("sessionId", "sequence");

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_jobOpportunityId_fkey" FOREIGN KEY ("jobOpportunityId") REFERENCES "JobOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewQuestion" ADD CONSTRAINT "InterviewQuestion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewResponse" ADD CONSTRAINT "InterviewResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "InterviewQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
