import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * GET /api/achievements
 * Get user's achievements
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const where: any = {
      userId: session.userId,
    };

    if (category) {
      where.achievement = {
        category: category.toUpperCase(),
      };
    }

    const achievements = await prisma.studentAchievement.findMany({
      where,
      include: {
        achievement: true,
      },
      orderBy: { unlockedAt: "desc" },
    });

    return NextResponse.json({
      data: achievements.map((sa) => ({
        id: sa.achievement.id,
        name: sa.achievement.name,
        description: sa.achievement.description,
        icon: sa.achievement.icon,
        category: sa.achievement.category,
        points: sa.achievement.points,
        badgeColor: sa.achievement.badgeColor,
        unlockedAt: sa.unlockedAt,
        progress: sa.progress,
        metadata: sa.metadata,
      })),
    });
  } catch (error) {
    console.error("Failed to get achievements:", error);
    return NextResponse.json(
      { error: "Failed to get achievements" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/achievements/available
 * Get available achievements that user hasn't unlocked yet
 */
export async function GET_AVAILABLE(request: NextRequest) {
  try {
    const session = await requireAuth(request);

    // Get all achievements
    const allAchievements = await prisma.achievement.findMany({
      orderBy: [
        { category: "asc" },
        { points: "desc" },
      ],
    });

    // Get user's unlocked achievements
    const unlockedAchievementIds = await prisma.studentAchievement
      .findMany({
        where: { userId: session.userId },
        select: { achievementId: true },
      })
      .then((achievements) => achievements.map((a) => a.achievementId));

    // Filter out already unlocked achievements
    const availableAchievements = allAchievements.filter(
      (achievement) => !unlockedAchievementIds.includes(achievement.id)
    );

    return NextResponse.json({
      data: availableAchievements.map((achievement) => ({
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        category: achievement.category,
        points: achievement.points,
        badgeColor: achievement.badgeColor,
        requirement: achievement.requirement,
      })),
    });
  } catch (error) {
    console.error("Failed to get available achievements:", error);
    return NextResponse.json(
      { error: "Failed to get available achievements" },
      { status: 500 }
    );
  }
}
