import { ProgressTrackingService } from "./progress-tracking-service";
import { prisma } from "@/lib/prisma";
import { EnrollmentStatus } from "@prisma/client";

export class ProgressService {
  /**
   * Initialize progress tracking for a new enrollment
   */
  static async initializeProgress(userId: string, courseId: string) {
    // Create enrollment if it doesn't exist
    const enrollment = await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      update: {},
      create: {
        userId,
        courseId,
        status: EnrollmentStatus.ACTIVE,
      },
      include: {
        course: {
          include: {
            lessons: true,
          },
        },
      },
    });

    // Create lesson progress records for all lessons
    if (enrollment.course.lessons.length > 0) {
      await prisma.lessonProgress.createMany({
        data: enrollment.course.lessons.map((lesson) => ({
          enrollmentId: enrollment.id,
          lessonId: lesson.id,
          status: "NOT_STARTED",
        })),
        skipDuplicates: true,
      });
    }

    return enrollment;
  }

  /**
   * Get comprehensive progress report for a student
   */
  static async getStudentProgressReport(userId: string) {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            lessons: true,
          },
        },
        lessonProgress: {
          include: {
            lesson: true,
          },
        },
      },
    });

    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter((e) => e.progressPercentage >= 100).length;
    const totalLessons = enrollments.reduce((sum, e) => sum + e.course.lessons.length, 0);
    const completedLessons = enrollments.reduce(
      (sum, e) => sum + e.lessonProgress.filter((lp) => lp.status === "COMPLETED").length,
      0
    );

    const totalStudyTime = enrollments.reduce((sum, e) => sum + e.totalStudyTime, 0);
    const averageProgress = totalCourses > 0 
      ? Math.round(enrollments.reduce((sum, e) => sum + e.progressPercentage, 0) / totalCourses)
      : 0;

    // Get achievements
    const achievements = await prisma.studentAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { unlockedAt: "desc" },
    });

    // Calculate learning streaks
    const currentStreak = await this.calculateCurrentStreak(userId);
    const longestStreak = await this.calculateLongestStreak(userId);

    // Get learning insights
    const insights = await this.generateLearningInsights(userId);

    return {
      overview: {
        totalCourses,
        completedCourses,
        totalLessons,
        completedLessons,
        totalStudyTime,
        averageProgress,
        currentStreak,
        longestStreak,
      },
      courses: enrollments.map((e) => ({
        id: e.course.id,
        title: e.course.title,
        progressPercentage: e.progressPercentage,
        completedAt: e.completedAt,
        lastAccessedAt: e.lastAccessedAt,
        streakDays: e.streakDays,
        totalStudyTime: e.totalStudyTime,
        lessonsCompleted: e.lessonProgress.filter((lp) => lp.status === "COMPLETED").length,
        totalLessons: e.course.lessons.length,
      })),
      achievements: achievements.map((sa) => ({
        id: sa.achievement.id,
        name: sa.achievement.name,
        description: sa.achievement.description,
        icon: sa.achievement.icon,
        category: sa.achievement.category,
        points: sa.achievement.points,
        unlockedAt: sa.unlockedAt,
      })),
      insights,
    };
  }

  /**
   * Calculate current learning streak
   */
  static async calculateCurrentStreak(userId: string): Promise<number> {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      orderBy: { lastAccessedAt: "desc" },
    });

    if (enrollments.length === 0) return 0;

    // Get the most recent access date
    const lastAccessed = enrollments[0].lastAccessedAt;
    if (!lastAccessed) return 0;

    const today = new Date();
    const lastAccessedDate = new Date(lastAccessed);
    const daysDiff = Math.floor((today.getTime() - lastAccessedDate.getTime()) / (1000 * 60 * 60 * 24));

    // If last access was today or yesterday, streak is active
    if (daysDiff <= 1) {
      return enrollments[0].streakDays || 0;
    }

    // Otherwise, streak is broken
    return 0;
  }

  /**
   * Calculate longest streak in history
   */
  static async calculateLongestStreak(userId: string): Promise<number> {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      select: { streakDays: true },
    });

    return Math.max(...enrollments.map((e) => e.streakDays || 0), 0);
  }

  /**
   * Generate learning insights and recommendations
   */
  static async generateLearningInsights(userId: string) {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            lessons: true,
          },
        },
        lessonProgress: true,
      },
    });

    const insights = {
      bestTimeOfDay: "Evening", // Would be calculated from actual data
      averageSessionLength: 45, // Would be calculated from actual data
      preferredFormats: [] as string[],
      strugglingTopics: [] as string[],
      strengths: [] as string[],
      recommendations: [] as string[],
    };

    // Analyze lesson formats
    const formatPerformance = new Map<string, { completed: number; total: number; avgScore: number }>();
    
    enrollments.forEach((enrollment) => {
      enrollment.course.lessons.forEach((lesson) => {
        const progress = enrollment.lessonProgress.find((lp) => lp.lessonId === lesson.id);
        if (progress) {
          const current = formatPerformance.get(lesson.format) || { completed: 0, total: 0, avgScore: 0 };
          current.total++;
          if (progress.status === "COMPLETED") {
            current.completed++;
            if (progress.completionScore) {
              current.avgScore = (current.avgScore + progress.completionScore) / 2;
            }
          }
          formatPerformance.set(lesson.format, current);
        }
      });
    });

    // Determine preferred formats (highest completion rates)
    insights.preferredFormats = Array.from(formatPerformance.entries())
      .sort((a, b) => (b[1].completed / b[1].total) - (a[1].completed / a[1].total))
      .slice(0, 3)
      .map(([format]) => format);

    // Generate recommendations based on performance
    if (insights.preferredFormats.length > 0) {
      insights.recommendations.push(
        `You learn best with ${insights.preferredFormats.join(", ")} formats. Focus on these types of lessons.`
      );
    }

    const avgProgress = enrollments.reduce((sum, e) => sum + e.progressPercentage, 0) / enrollments.length;
    if (avgProgress < 50) {
      insights.recommendations.push("Consider setting smaller, daily goals to maintain momentum.");
    }

    const avgStreak = enrollments.reduce((sum, e) => sum + e.streakDays, 0) / enrollments.length;
    if (avgStreak < 3) {
      insights.recommendations.push("Try to maintain a consistent daily learning habit, even if it's just 15 minutes.");
    }

    return insights;
  }

  /**
   * Get course-specific analytics for instructors
   */
  static async getCourseAnalytics(courseId: string) {
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
          },
        },
        lessonProgress: {
          include: {
            lesson: true,
          },
        },
      },
    });

    const lessons = await prisma.lesson.findMany({
      where: { courseId },
      include: {
        lessonProgress: true,
      },
      orderBy: { order: "asc" },
    });

    // Calculate metrics
    const totalEnrollments = enrollments.length;
    const activeEnrollments = enrollments.filter((e) => 
      e.lastAccessedAt && 
      new Date(e.lastAccessedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    const completedEnrollments = enrollments.filter((e) => e.progressPercentage >= 100).length;

    const lessonAnalytics = lessons.map((lesson) => {
      const progress = lesson.lessonProgress;
      const completed = progress.filter((lp) => lp.status === "COMPLETED").length;
      const averageScore = progress
        .filter((lp) => lp.completionScore !== null)
        .reduce((sum, lp) => sum + lp.completionScore!, 0) / 
        progress.filter((lp) => lp.completionScore !== null).length || 0;

      return {
        id: lesson.id,
        title: lesson.title,
        totalStudents: progress.length,
        completed,
        completionRate: progress.length > 0 ? (completed / progress.length) * 100 : 0,
        averageScore: Math.round(averageScore),
        averageTimeSpent: progress.reduce((sum, lp) => sum + lp.timeSpentMinutes, 0) / progress.length || 0,
      };
    });

    return {
      overview: {
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        completionRate: totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0,
      },
      lessons: lessonAnalytics,
      enrollments: enrollments.map((e) => ({
        user: e.user,
        progressPercentage: e.progressPercentage,
        lastAccessedAt: e.lastAccessedAt,
        streakDays: e.streakDays,
        totalStudyTime: e.totalStudyTime,
      })),
    };
  }

  /**
   * Sync progress from client-side tracking
   */
  static async syncProgress(userId: string, courseId: string, clientData: any) {
    // This would handle syncing progress data from client-side storage
    // Useful for offline-first functionality
    console.log("Syncing progress for user", userId, "in course", courseId);
    
    // Implementation would validate and merge client data with server data
    // Handle conflicts, update timestamps, etc.
  }
}
