import { prisma } from "@/lib/prisma";

export async function getUserAnalytics(userId: string) {
  return prisma.interviewSession.findMany({
    where: { userId },
    include: { responses: true },
  });
}

export async function getSessionAnalytics(sessionId: string) {
  return prisma.interviewSession.findUnique({
    where: { id: sessionId },
    include: { responses: true },
  });
}

export async function getRoleAnalytics(role: string) {
  return prisma.interviewSession.findMany({
    where: { role },
    include: { responses: true },
  });
}

export async function calculateAverageScoreByRole(role: string) {
  const sessions = await prisma.interviewSession.findMany({
    where: { role },
  });
  
  if (sessions.length === 0) return 0;
  
  const totalScore = sessions.reduce((sum, s) => sum + (s.score || 0), 0);
  return totalScore / sessions.length;
}


export async function getRoleAverageScore(role: string) {
  return calculateAverageScoreByRole(role);
}
