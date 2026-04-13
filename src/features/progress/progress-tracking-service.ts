import { prisma } from "@/lib/prisma";

export interface ProgressMetrics {
  lessonId: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  watchTimeSeconds?: number;
  timeSpentMinutes?: number;
  videoProgress?: number;
  scrollProgress?: number;
  completionScore?: number;
  engagementMetrics?: {
    clicks?: number;
    scrolls?: number;
    pauses?: number;
    seeks?: number;
    resourceDownloads?: number;
  };
}

export interface CourseProgressSummary {
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  notStartedLessons: number;
  progressPercentage: number;
  totalStudyTime: number;
  averageTimePerLesson: number;
  streakDays: number;
  progressVelocity: number; // lessons per week
  estimatedWeeksToComplete: number | null;
  engagementScore: number;
  lastAccessedAt: Date | null;
}

export class ProgressTrackingService {
  /**
   * Track lesson progress with automatic course progress calculation
   */
  static async trackLessonProgress(
    userId: string,
    courseId: string,
    metrics: ProgressMetrics
  ) {
    // Find or create enrollment
    let enrollment = await prisma.enrollment.findFirst({
      where: { userId, courseId },
      include: {
        course: { include: { lessons: { select: { id: true } } } },
        lessonProgress: { where: { lessonId: metrics.lessonId } },
      },
    });

    if (!enrollment) {
      throw new Error("User not enrolled in course");
    }

    // Update or create lesson progress
    const lessonProgress = await prisma.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: enrollment.id,
          lessonId: metrics.lessonId,
        },
      },
      update: {
        status: metrics.status,
        watchTimeSeconds: {
          increment: metrics.watchTimeSeconds || 0,
        },
        timeSpentMinutes: {
          increment: metrics.timeSpentMinutes || 0,
        },
        videoProgress: metrics.videoProgress,
        scrollProgress: metrics.scrollProgress,
        completionScore: metrics.completionScore,
        engagementMetrics: metrics.engagementMetrics || {},
        lastAccessedAt: new Date(),
        completedAt: metrics.status === "COMPLETED" ? new Date() : undefined,
      },
      create: {
        enrollmentId: enrollment.id,
        lessonId: metrics.lessonId,
        status: metrics.status,
        watchTimeSeconds: metrics.watchTimeSeconds || 0,
        timeSpentMinutes: metrics.timeSpentMinutes || 0,
        videoProgress: metrics.videoProgress || 0,
        scrollProgress: metrics.scrollProgress || 0,
        completionScore: metrics.completionScore,
        engagementMetrics: metrics.engagementMetrics || {},
        lastAccessedAt: new Date(),
        completedAt: metrics.status === "COMPLETED" ? new Date() : null,
      },
    });

    // Update course progress
    await this.updateCourseProgress(enrollment.id);

    // Check for achievements
    await this.checkAchievements(userId, enrollment.id);

    return lessonProgress;
  }

  /**
   * Update overall course progress based on lesson progress
   */
  static async updateCourseProgress(enrollmentId: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: { include: { lessons: { select: { id: true } } } },
        lessonProgress: true,
      },
    });

    if (!enrollment) return;

    const totalLessons = enrollment.course.lessons.length;
    const completedLessons = enrollment.lessonProgress.filter(
      (lp) => lp.status === "COMPLETED"
    ).length;
    const progressPercentage = totalLessons > 0 
      ? Math.round((completedLessons / totalLessons) * 100) 
      : 0;

    // Calculate streak
    const today = new Date();
    const lastAccessed = enrollment.lastAccessedAt ? new Date(enrollment.lastAccessedAt) : null;
    let streakDays = enrollment.streakDays || 0;

    if (lastAccessed) {
      const daysDiff = Math.floor((today.getTime() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        streakDays += 1;
      } else if (daysDiff > 1) {
        streakDays = 1;
      }
    } else {
      streakDays = 1;
    }

    // Calculate engagement score
    const totalEngagement = enrollment.lessonProgress.reduce((acc, lp) => {
      const metrics = lp.engagementMetrics as any || {};
      return acc + (metrics.clicks || 0) + (metrics.scrolls || 0);
    }, 0);
    const engagementScore = Math.min(1, totalEngagement / (enrollment.lessonProgress.length * 10));

    // Update enrollment
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        progressPercentage,
        lastAccessedAt: new Date(),
        streakDays,
        lastStreakDate: today,
        completedAt: progressPercentage >= 100 ? new Date() : enrollment.completedAt,
        engagementScore,
        totalStudyTime: {
          increment: enrollment.lessonProgress.reduce(
            (sum, lp) => sum + lp.timeSpentMinutes,
            0
          ),
        },
      },
    });
  }

  /**
   * Get comprehensive course progress summary
   */
  static async getCourseProgressSummary(
    userId: string,
    courseId: string
  ): Promise<CourseProgressSummary | null> {
    const enrollment = await prisma.enrollment.findFirst({
      where: { userId, courseId },
      include: {
        course: { include: { lessons: true } },
        lessonProgress: true,
      },
    });

    if (!enrollment) return null;

    const totalLessons = enrollment.course.lessons.length;
    const completedLessons = enrollment.lessonProgress.filter(
      (lp) => lp.status === "COMPLETED"
    ).length;
    const inProgressLessons = enrollment.lessonProgress.filter(
      (lp) => lp.status === "IN_PROGRESS"
    ).length;
    const notStartedLessons = totalLessons - completedLessons - inProgressLessons;

    const totalStudyTime = enrollment.lessonProgress.reduce(
      (sum, lp) => sum + lp.timeSpentMinutes,
      0
    );
    const averageTimePerLesson = completedLessons > 0 
      ? Math.round(totalStudyTime / completedLessons)
      : 0;

    // Calculate progress velocity
    const weeksSinceStart = Math.max(
      1,
      Math.floor((Date.now() - enrollment.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 7))
    );
    const progressVelocity = completedLessons / weeksSinceStart;

    // Predict completion time
    const remainingLessons = totalLessons - completedLessons;
    const estimatedWeeksToComplete = progressVelocity > 0 
      ? Math.ceil(remainingLessons / progressVelocity)
      : null;

    return {
      totalLessons,
      completedLessons,
      inProgressLessons,
      notStartedLessons,
      progressPercentage: enrollment.progressPercentage,
      totalStudyTime,
      averageTimePerLesson,
      streakDays: enrollment.streakDays,
      progressVelocity,
      estimatedWeeksToComplete,
      engagementScore: enrollment.engagementScore,
      lastAccessedAt: enrollment.lastAccessedAt,
    };
  }

  /**
   * Get student's overall learning analytics
   */
  static async getStudentAnalytics(userId: string) {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: { include: { lessons: true } },
        lessonProgress: true,
      },
    });

    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(e => e.progressPercentage >= 100).length;
    const totalStudyTime = enrollments.reduce((sum, e) => sum + e.totalStudyTime, 0);
    const averageProgress = totalCourses > 0 
      ? Math.round(enrollments.reduce((sum, e) => sum + e.progressPercentage, 0) / totalCourses)
      : 0;

    // Calculate longest streak
    const longestStreak = Math.max(...enrollments.map(e => e.streakDays));

    // Get recent achievements
    const recentAchievements = await prisma.studentAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { unlockedAt: "desc" },
      take: 10,
    });

    return {
      totalCourses,
      completedCourses,
      totalStudyTime,
      averageProgress,
      longestStreak,
      recentAchievements: recentAchievements.map(sa => ({
        name: sa.achievement.name,
        description: sa.achievement.description,
        icon: sa.achievement.icon,
        category: sa.achievement.category,
        unlockedAt: sa.unlockedAt,
      })),
    };
  }

  /**
   * Check and unlock achievements
   */
  static async checkAchievements(userId: string, enrollmentId: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        lessonProgress: true,
        course: true,
      },
    });

    if (!enrollment) return;

    const achievements = await prisma.achievement.findMany();
    
    for (const achievement of achievements) {
      // Check if user already has this achievement
      const existing = await prisma.studentAchievement.findFirst({
        where: {
          userId,
          achievementId: achievement.id,
        },
      });

      if (existing) continue;

      // Check achievement conditions
      let unlocked = false;
      const requirement = achievement.requirement as any;

      switch (achievement.category) {
        case "COMPLETION":
          if (requirement.type === "First Lesson") {
            unlocked = enrollment.lessonProgress.some(lp => lp.status === "COMPLETED");
          } else if (requirement.type === "Course Graduate") {
            unlocked = enrollment.progressPercentage >= 100;
          } else if (requirement.type === "Half Way There") {
            unlocked = enrollment.progressPercentage >= 50;
          }
          break;

        case "STREAK":
          if (requirement.type === "Week Warrior") {
            unlocked = enrollment.streakDays >= 7;
          } else if (requirement.type === "Month Master") {
            unlocked = enrollment.streakDays >= 30;
          }
          break;

        case "ENGAGEMENT":
          if (requirement.type === "Dedicated Learner") {
            unlocked = enrollment.totalStudyTime >= 600; // 10 hours
          } else if (requirement.type === "Power Student") {
            unlocked = enrollment.totalStudyTime >= 1800; // 30 hours
          }
          break;

        case "PERFORMANCE":
          if (requirement.type === "Perfect Score") {
            unlocked = enrollment.lessonProgress.some(
              lp => lp.completionScore !== null && lp.completionScore >= 95
            );
          }
          break;
      }

      if (unlocked) {
        await prisma.studentAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            progress: 1,
          },
        });
      }
    }
  }

  /**
   * Get at-risk students (for instructors)
   */
  static async getAtRiskStudents(courseId: string) {
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        lessonProgress: true,
      },
    });

    const atRiskStudents = enrollments.filter(enrollment => {
      const daysSinceLastAccess = enrollment.lastAccessedAt
        ? Math.floor((Date.now() - enrollment.lastAccessedAt.getTime()) / (1000 * 60 * 60 * 24))
        : Infinity;

      return (
        daysSinceLastAccess > 7 || // No access for over a week
        enrollment.progressPercentage < 25 || // Less than 25% progress
        (enrollment.streakDays === 0 && enrollment.createdAt < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // No streak after a week
      );
    });

    return atRiskStudents.map(enrollment => ({
      user: enrollment.user,
      enrollment: {
        progressPercentage: enrollment.progressPercentage,
        streakDays: enrollment.streakDays,
        lastAccessedAt: enrollment.lastAccessedAt,
        totalStudyTime: enrollment.totalStudyTime,
      },
      riskFactors: {
        inactiveForDays: enrollment.lastAccessedAt
          ? Math.floor((Date.now() - enrollment.lastAccessedAt.getTime()) / (1000 * 60 * 60 * 24))
          : null,
        lowProgress: enrollment.progressPercentage < 25,
        noStreak: enrollment.streakDays === 0,
      },
    }));
  }
}
