-- Create TutorApprovalStatus enum
CREATE TYPE "TutorApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- Create TutorApproval table
CREATE TABLE "TutorApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tutorId" TEXT NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "status" "TutorApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TutorApproval_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TutorApproval_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create unique index on tutorId
CREATE UNIQUE INDEX "TutorApproval_tutorId_key" ON "TutorApproval"("tutorId");

-- Create index on status
CREATE INDEX "TutorApproval_status_idx" ON "TutorApproval"("status");
