-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "assignmentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_assignmentId_key" ON "Enrollment"("assignmentId");

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "CourseAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
