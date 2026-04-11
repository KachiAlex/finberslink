import { prisma } from "@/lib/prisma";

export async function getInterviewSessions(userId: string) {
  return prisma.interviewSession.findMany({
    where: { userId },
  });
}

export async function assertQuestionOwnership(questionId: string, userId: string) {
  const question = await prisma.interviewQuestion.findUnique({
    where: { id: questionId },
  });
  return question?.createdBy === userId;
}


export async function createInterviewSession(userId: string, roleId: string) {
  return prisma.interviewSession.create({
    data: { userId, roleId },
  });
}

export async function addInterviewQuestion(sessionId: string, question: string) {
  return prisma.interviewQuestion.create({
    data: { sessionId, question },
  });
}

export async function assertSessionOwnership(sessionId: string, userId: string) {
  const session = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
  });
  return session?.userId === userId;
}

export async function getInterviewSession(sessionId: string) {
  return prisma.interviewSession.findUnique({
    where: { id: sessionId },
    include: { questions: true },
  });
}

export async function updateInterviewSession(sessionId: string, data: any) {
  return prisma.interviewSession.update({
    where: { id: sessionId },
    data,
  });
}

export async function recordInterviewResponse(sessionId: string, questionId: string, response: string) {
  return prisma.interviewResponse.create({
    data: { sessionId, questionId, response },
  });
}

export async function listInterviewSessions(userId: string) {
  return prisma.interviewSession.findMany({
    where: { userId },
    include: { questions: true },
  });
}
