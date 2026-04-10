import { prisma } from '@/lib/prisma';
import type { InterviewSession } from '@prisma/client';

export interface SessionAnalytics {
  sessionId: string;
  overallScore: number | null;
  skills: SkillAnalysis[];
  responseCount: number;
  averageResponseScore: number | null;
  completionPercentage: number;
}

export interface SkillAnalysis {
  name: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced';
  mentions: number;
  trend?: 'improving' | 'stable' | 'declining';
}

export interface UserAnalytics {
  userId: string;
  totalSessions: number;
  averageScore: number | null;
  scoreTrends: ScoreTrend[];
  skillsAnalysis: SkillAnalysis[];
  roleAverages: RoleAverage[];
  percentiles: RolePercentile[];
}

export interface ScoreTrend {
  sessionId: string;
  date: Date;
  score: number | null;
  role: string;
}

export interface RoleAverage {
  role: string;
  averageScore: number | null;
  sessionCount: number;
}

export interface RolePercentile {
  role: string;
  userScore: number | null;
  roleAverage: number | null;
  percentile: number | null;
}

/**
 * Calculate overall score for a session by averaging all response scores
 */
export async function calculateSessionScore(sessionId: string): Promise<number | null> {
  try {
    const responses = await prisma.interviewResponse.findMany({
      where: {
        question: {
          sessionId,
        },
      },
      select: {
        score: true,
      },
    });

    if (responses.length === 0) {
      return null;
    }

    const scoredResponses = responses.filter((r) => r.score !== null);
    if (scoredResponses.length === 0) {
      return null;
    }

    const totalScore = scoredResponses.reduce((sum, r) => sum + (r.score || 0), 0);
    return Math.round((totalScore / scoredResponses.length) * 100) / 100;
  } catch (error) {
    console.error('Error calculating session score:', error);
    throw error;
  }
}

/**
 * Extract skills from AI feedback in responses
 */
export async function extractSkillsFromSession(sessionId: string): Promise<SkillAnalysis[]> {
  try {
    const responses = await prisma.interviewResponse.findMany({
      where: {
        question: {
          sessionId,
        },
      },
      select: {
        aiFeedback: true,
      },
    });

    const skillsMap = new Map<string, SkillAnalysis>();

    // Common skill keywords to extract from feedback
    const skillKeywords = [
      'communication',
      'problem-solving',
      'technical',
      'leadership',
      'teamwork',
      'creativity',
      'analytical',
      'strategic',
      'time management',
      'attention to detail',
      'adaptability',
      'critical thinking',
      'collaboration',
      'presentation',
      'negotiation',
      'conflict resolution',
    ];

    responses.forEach((response) => {
      if (!response.aiFeedback) return;

      const feedback = response.aiFeedback.toLowerCase();

      skillKeywords.forEach((skill) => {
        if (feedback.includes(skill)) {
          const existing = skillsMap.get(skill) || {
            name: skill,
            proficiency: 'intermediate' as const,
            mentions: 0,
          };

          existing.mentions += 1;

          // Determine proficiency based on feedback context
          if (
            feedback.includes(`strong ${skill}`) ||
            feedback.includes(`excellent ${skill}`) ||
            feedback.includes(`advanced ${skill}`)
          ) {
            existing.proficiency = 'advanced';
          } else if (
            feedback.includes(`weak ${skill}`) ||
            feedback.includes(`poor ${skill}`) ||
            feedback.includes(`needs improvement in ${skill}`)
          ) {
            existing.proficiency = 'beginner';
          }

          skillsMap.set(skill, existing);
        }
      });
    });

    return Array.from(skillsMap.values()).sort((a, b) => b.mentions - a.mentions);
  } catch (error) {
    console.error('Error extracting skills from session:', error);
    throw error;
  }
}

/**
 * Get user's score trends across recent sessions
 */
export async function getUserScoreTrends(
  userId: string,
  limit: number = 10
): Promise<ScoreTrend[]> {
  try {
    const sessions = await prisma.interviewSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        targetRole: true,
        createdAt: true,
        questions: {
          select: {
            responses: {
              select: {
                score: true,
              },
            },
          },
        },
      },
    });

    return sessions.map((session) => {
      const allScores = session.questions
        .flatMap((q) => q.responses)
        .map((r) => r.score)
        .filter((s) => s !== null);

      const score =
        allScores.length > 0
          ? Math.round((allScores.reduce((a, b) => a + (b || 0), 0) / allScores.length) * 100) /
            100
          : null;

      return {
        sessionId: session.id,
        date: session.createdAt,
        score,
        role: session.targetRole,
      };
    });
  } catch (error) {
    console.error('Error getting user score trends:', error);
    throw error;
  }
}

/**
 * Get average score for a specific role across all users
 */
export async function getRoleAverageScore(role: string): Promise<number | null> {
  try {
    const sessions = await prisma.interviewSession.findMany({
      where: { targetRole: role },
      select: {
        questions: {
          select: {
            responses: {
              select: {
                score: true,
              },
            },
          },
        },
      },
    });

    const allScores = sessions
      .flatMap((s) => s.questions)
      .flatMap((q) => q.responses)
      .map((r) => r.score)
      .filter((s) => s !== null);

    if (allScores.length === 0) {
      return null;
    }

    return Math.round((allScores.reduce((a, b) => a + (b || 0), 0) / allScores.length) * 100) / 100;
  } catch (error) {
    console.error('Error getting role average score:', error);
    throw error;
  }
}

/**
 * Calculate user's percentile for a specific role
 */
export async function getUserPercentile(
  userId: string,
  role: string
): Promise<number | null> {
  try {
    // Get user's average score for this role
    const userSessions = await prisma.interviewSession.findMany({
      where: { userId, targetRole: role },
      select: {
        questions: {
          select: {
            responses: {
              select: {
                score: true,
              },
            },
          },
        },
      },
    });

    const userScores = userSessions
      .flatMap((s) => s.questions)
      .flatMap((q) => q.responses)
      .map((r) => r.score)
      .filter((s) => s !== null);

    if (userScores.length === 0) {
      return null;
    }

    const userAverage =
      userScores.reduce((a, b) => a + (b || 0), 0) / userScores.length;

    // Get all scores for this role
    const allSessions = await prisma.interviewSession.findMany({
      where: { targetRole: role },
      select: {
        questions: {
          select: {
            responses: {
              select: {
                score: true,
              },
            },
          },
        },
      },
    });

    const allScores = allSessions
      .flatMap((s) => s.questions)
      .flatMap((q) => q.responses)
      .map((r) => r.score)
      .filter((s) => s !== null);

    if (allScores.length === 0) {
      return null;
    }

    // Calculate percentile
    const scoresBelow = allScores.filter((s) => s < userAverage).length;
    const percentile = Math.round((scoresBelow / allScores.length) * 100);

    return percentile;
  } catch (error) {
    console.error('Error calculating user percentile:', error);
    throw error;
  }
}

/**
 * Get comprehensive analytics for a session
 */
export async function getSessionAnalytics(sessionId: string): Promise<SessionAnalytics> {
  try {
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      select: {
        questions: {
          select: {
            responses: {
              select: {
                score: true,
                aiFeedback: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const responses = session.questions.flatMap((q) => q.responses);
    const overallScore = await calculateSessionScore(sessionId);
    const skills = await extractSkillsFromSession(sessionId);

    const scoredResponses = responses.filter((r) => r.score !== null);
    const averageResponseScore =
      scoredResponses.length > 0
        ? Math.round(
            (scoredResponses.reduce((sum, r) => sum + (r.score || 0), 0) /
              scoredResponses.length) *
              100
          ) / 100
        : null;

    const completionPercentage =
      responses.length > 0
        ? Math.round((scoredResponses.length / responses.length) * 100)
        : 0;

    return {
      sessionId,
      overallScore,
      skills,
      responseCount: responses.length,
      averageResponseScore,
      completionPercentage,
    };
  } catch (error) {
    console.error('Error getting session analytics:', error);
    throw error;
  }
}

/**
 * Get comprehensive user analytics
 */
export async function getUserAnalytics(userId: string): Promise<UserAnalytics> {
  try {
    const sessions = await prisma.interviewSession.findMany({
      where: { userId },
      select: {
        id: true,
        targetRole: true,
        createdAt: true,
        questions: {
          select: {
            responses: {
              select: {
                score: true,
                aiFeedback: true,
              },
            },
          },
        },
      },
    });

    // Calculate overall stats
    const allScores = sessions
      .flatMap((s) => s.questions)
      .flatMap((q) => q.responses)
      .map((r) => r.score)
      .filter((s) => s !== null);

    const averageScore =
      allScores.length > 0
        ? Math.round((allScores.reduce((a, b) => a + (b || 0), 0) / allScores.length) * 100) / 100
        : null;

    // Get score trends
    const scoreTrends = await getUserScoreTrends(userId);

    // Extract skills across all sessions
    const allSkillsMap = new Map<string, SkillAnalysis>();
    for (const session of sessions) {
      const skills = await extractSkillsFromSession(session.id);
      skills.forEach((skill) => {
        const existing = allSkillsMap.get(skill.name) || skill;
        existing.mentions += skill.mentions;
        allSkillsMap.set(skill.name, existing);
      });
    }

    const skillsAnalysis = Array.from(allSkillsMap.values()).sort(
      (a, b) => b.mentions - a.mentions
    );

    // Get role averages
    const roleSet = new Set(sessions.map((s) => s.targetRole));
    const roleAverages: RoleAverage[] = [];
    for (const role of roleSet) {
      const roleSessions = sessions.filter((s) => s.targetRole === role);
      const roleScores = roleSessions
        .flatMap((s) => s.questions)
        .flatMap((q) => q.responses)
        .map((r) => r.score)
        .filter((s) => s !== null);

      const averageScore =
        roleScores.length > 0
          ? Math.round((roleScores.reduce((a, b) => a + (b || 0), 0) / roleScores.length) * 100) /
            100
          : null;

      roleAverages.push({
        role,
        averageScore,
        sessionCount: roleSessions.length,
      });
    }

    // Get percentiles for each role
    const percentiles: RolePercentile[] = [];
    for (const role of roleSet) {
      const userPercentile = await getUserPercentile(userId, role);
      const roleAverage = await getRoleAverageScore(role);
      const userRoleAverage = roleAverages.find((r) => r.role === role)?.averageScore || null;

      percentiles.push({
        role,
        userScore: userRoleAverage,
        roleAverage,
        percentile: userPercentile,
      });
    }

    return {
      userId,
      totalSessions: sessions.length,
      averageScore,
      scoreTrends,
      skillsAnalysis,
      roleAverages,
      percentiles,
    };
  } catch (error) {
    console.error('Error getting user analytics:', error);
    throw error;
  }
}
