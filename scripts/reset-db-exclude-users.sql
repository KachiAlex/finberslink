-- NUCLEAR DATABASE RESET - DROP AND RECREATE
-- This script drops all non-user tables and enums
-- User data is PRESERVED

-- Drop all Course-related tables and their dependencies
DROP TABLE IF EXISTS "CourseCertificate" CASCADE;
DROP TABLE IF EXISTS "CourseAssignment" CASCADE;
DROP TABLE IF EXISTS "ExamSubmission" CASCADE;
DROP TABLE IF EXISTS "ExamQuestion" CASCADE;
DROP TABLE IF EXISTS "Exam" CASCADE;
DROP TABLE IF EXISTS "LessonProgress" CASCADE;
DROP TABLE IF EXISTS "LessonResource" CASCADE;
DROP TABLE IF EXISTS "Lesson" CASCADE;
DROP TABLE IF EXISTS "Enrollment" CASCADE;
DROP TABLE IF EXISTS "Course" CASCADE;

-- Drop Chat-related tables
DROP TABLE IF EXISTS "ChatMessage" CASCADE;
DROP TABLE IF EXISTS "ChatReaction" CASCADE;
DROP TABLE IF EXISTS "ChatMembership" CASCADE;
DROP TABLE IF EXISTS "ChatThread" CASCADE;
DROP TABLE IF EXISTS "ChatSpace" CASCADE;

-- Drop Forum-related tables
DROP TABLE IF EXISTS "ForumPost" CASCADE;
DROP TABLE IF EXISTS "ForumThread" CASCADE;

-- Drop other feature tables
DROP TABLE IF EXISTS "TutorApproval" CASCADE;
DROP TABLE IF EXISTS "VolunteerApplication" CASCADE;
DROP TABLE IF EXISTS "VolunteerOpportunity" CASCADE;
DROP TABLE IF EXISTS "InterviewSession" CASCADE;
DROP TABLE IF EXISTS "JobApplication" CASCADE;
DROP TABLE IF EXISTS "Job" CASCADE;
DROP TABLE IF EXISTS "NewsPost" CASCADE;

-- Drop enums (they'll be recreated by Prisma)
DROP TYPE IF EXISTS "CourseApprovalStatus" CASCADE;
DROP TYPE IF EXISTS "CourseLevel" CASCADE;
DROP TYPE IF EXISTS "LessonFormat" CASCADE;
DROP TYPE IF EXISTS "ExamFormat" CASCADE;
DROP TYPE IF EXISTS "JobType" CASCADE;
DROP TYPE IF EXISTS "VolunteerOpportunityType" CASCADE;
DROP TYPE IF EXISTS "ApplicationStatus" CASCADE;
DROP TYPE IF EXISTS "TutorApprovalStatus" CASCADE;

-- Verify User table still exists
SELECT 'User table preserved' as status;
