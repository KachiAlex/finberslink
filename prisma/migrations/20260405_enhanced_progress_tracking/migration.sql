-- CreateIndex
CREATE INDEX "idx_enrollment_user_progress" ON "enrollment"("userId", "progressPercentage");

-- CreateIndex
CREATE INDEX "idx_enrollment_course_progress" ON "enrollment"("courseId", "progressPercentage");

-- CreateIndex
CREATE INDEX "idx_enrollment_last_accessed" ON "enrollment"("lastAccessedAt");

-- CreateIndex
CREATE INDEX "idx_lesson_progress_enrollment_status" ON "lesson_progress"("enrollmentId", "status");

-- CreateIndex
CREATE INDEX "idx_lesson_progress_lesson_status" ON "lesson_progress"("lessonId", "status");

-- CreateIndex
CREATE INDEX "idx_student_achievement_user_unlocked" ON "student_achievement"("userId", "unlockedAt");

-- AddColumn
ALTER TABLE "lesson_progress" ADD COLUMN "watchTimeSeconds" INTEGER NOT NULL DEFAULT 0;

-- AddColumn
ALTER TABLE "lesson_progress" ADD COLUMN "timeSpentMinutes" INTEGER NOT NULL DEFAULT 0;

-- AddColumn
ALTER TABLE "lesson_progress" ADD COLUMN "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddColumn
ALTER TABLE "lesson_progress" ADD COLUMN "completionScore" DOUBLE PRECISION;

-- AddColumn
ALTER TABLE "lesson_progress" ADD COLUMN "engagementMetrics" JSON NOT NULL DEFAULT '{}';

-- AddColumn
ALTER TABLE "lesson_progress" ADD COLUMN "videoProgress" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AddColumn
ALTER TABLE "lesson_progress" ADD COLUMN "scrollProgress" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AddColumn
ALTER TABLE "enrollment" ADD COLUMN "totalStudyTime" INTEGER NOT NULL DEFAULT 0;

-- AddColumn
ALTER TABLE "enrollment" ADD COLUMN "streakDays" INTEGER NOT NULL DEFAULT 0;

-- AddColumn
ALTER TABLE "enrollment" ADD COLUMN "averageScore" DOUBLE PRECISION;

-- AddColumn
ALTER TABLE "enrollment" ADD COLUMN "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AddColumn
ALTER TABLE "enrollment" ADD COLUMN "lastStreakDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "achievement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" "AchievementCategory" NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "badgeColor" TEXT NOT NULL DEFAULT '#3B82F6',
    "requirement" JSON NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_achievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSON,

    CONSTRAINT "student_achievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_achievement_user_achievement_unique" ON "student_achievement"("userId", "achievementId");

-- AddForeignKey
ALTER TABLE "student_achievement" ADD CONSTRAINT "student_achievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_achievement" ADD CONSTRAINT "student_achievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddRelation
ALTER TABLE "user" ADD COLUMN "studentAchievements" "student_achievement"[];

-- CreateEnum
CREATE TYPE "AchievementCategory" AS ENUM ('COMPLETION', 'STREAK', 'ENGAGEMENT', 'PERFORMANCE', 'SOCIAL', 'MILESTONE');
