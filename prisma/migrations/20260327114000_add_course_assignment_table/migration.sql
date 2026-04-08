-- Create enum for course assignment statuses if missing
DO $$
BEGIN
  CREATE TYPE "CourseAssignmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- Create course assignment table if missing
CREATE TABLE IF NOT EXISTS "CourseAssignment" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "assignedById" TEXT NOT NULL,
  "status" "CourseAssignmentStatus" NOT NULL DEFAULT 'PENDING',
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acceptedAt" TIMESTAMP(3),
  "declinedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "notes" TEXT,

  CONSTRAINT "CourseAssignment_pkey" PRIMARY KEY ("id")
);

-- Add indexes used by admin assignment queries
CREATE INDEX IF NOT EXISTS "CourseAssignment_courseId_idx" ON "CourseAssignment"("courseId");
CREATE INDEX IF NOT EXISTS "CourseAssignment_studentId_idx" ON "CourseAssignment"("studentId");

-- Add foreign keys to match Prisma relations
DO $$
BEGIN
  ALTER TABLE "CourseAssignment"
    ADD CONSTRAINT "CourseAssignment_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  ALTER TABLE "CourseAssignment"
    ADD CONSTRAINT "CourseAssignment_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  ALTER TABLE "CourseAssignment"
    ADD CONSTRAINT "CourseAssignment_assignedById_fkey"
    FOREIGN KEY ("assignedById") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
