-- Add tutorEditingLocked column to Course table
ALTER TABLE "Course" ADD COLUMN "tutorEditingLocked" BOOLEAN NOT NULL DEFAULT false;
