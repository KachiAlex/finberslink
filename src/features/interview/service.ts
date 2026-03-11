import type { InterviewFlowStep, InterviewSessionStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { generateInterviewSessionInsights } from "./ai";

const sessionInclude = {
  questions: {
    orderBy: { sequence: "asc" },
    include: {
      responses: {
        orderBy: { submittedAt: "asc" },
      },
    },
  },
  resume: {
    select: {
      id: true,
      title: true,
      slug: true,
    },
  },
  jobOpportunity: {
    select: {
      id: true,
      title: true,
      company: true,
      slug: true,
    },
  },
} as const;

export type InterviewSessionPayload = Prisma.InterviewSessionGetPayload<{
  include: typeof sessionInclude;
}>;

export interface CreateInterviewSessionInput {
  userId: string;
  targetRole: string;
  resumeId?: string;
  jobOpportunityId?: string;
  status?: InterviewSessionStatus;
  currentStep?: InterviewFlowStep;
  initialQuestion?: {
    prompt: string;
    rubric?: Prisma.InputJsonValue;
  };
}

export async function createInterviewSession(input: CreateInterviewSessionInput) {
  const sequence = input.initialQuestion ? 1 : undefined;

  return prisma.interviewSession.create({
    data: {
      userId: input.userId,
      resumeId: input.resumeId,
      jobOpportunityId: input.jobOpportunityId,
      targetRole: input.targetRole,
      status: input.status ?? "ACTIVE",
      currentStep: input.currentStep ?? "QUESTION_PHASE",
      questions: input.initialQuestion
        ? {
            create: {
              prompt: input.initialQuestion.prompt,
              rubric: input.initialQuestion.rubric ?? null,
              sequence: sequence!,
            },
          }
        : undefined,
    },
    include: sessionInclude,
  });
}

export async function listInterviewSessions(userId: string) {
  return prisma.interviewSession.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: sessionInclude,
  });
}

export async function getInterviewSession(sessionId: string, userId: string) {
  const session = await prisma.interviewSession.findFirst({
    where: { id: sessionId, userId },
    include: sessionInclude,
  });

  if (!session) {
    throw new Error("Interview session not found");
  }

  return session;
}

export interface UpdateInterviewSessionInput {
  status?: InterviewSessionStatus;
  currentStep?: InterviewFlowStep;
  summary?: string | null;
  recommendation?: string | null;
  rating?: number | null;
}

export async function updateInterviewSession(sessionId: string, userId: string, data: UpdateInterviewSessionInput) {
  await assertSessionOwnership(sessionId, userId);

  return prisma.interviewSession.update({
    where: { id: sessionId },
    data: {
      status: data.status,
      currentStep: data.currentStep,
      summary: data.summary,
      recommendation: data.recommendation,
      rating: data.rating ?? undefined,
    },
    include: sessionInclude,
  });
}

export interface AddInterviewQuestionInput {
  prompt: string;
  sequence?: number;
  rubric?: Prisma.InputJsonValue;
}

export async function addInterviewQuestion(sessionId: string, userId: string, input: AddInterviewQuestionInput) {
  await assertSessionOwnership(sessionId, userId);

  const nextSequence =
    input.sequence ?? (await prisma.interviewQuestion.count({ where: { sessionId } })) + 1;

  return prisma.interviewQuestion.create({
    data: {
      sessionId,
      prompt: input.prompt,
      rubric: input.rubric ?? null,
      sequence: nextSequence,
    },
  });
}

export interface RecordInterviewResponseInput {
  questionId: string;
  transcript: string;
  audioUrl?: string;
  aiFeedback?: string;
  score?: number;
}

export async function recordInterviewResponse(
  sessionId: string,
  userId: string,
  input: RecordInterviewResponseInput,
) {
  await assertQuestionOwnership(input.questionId, sessionId, userId);

  const response = await prisma.interviewResponse.create({
    data: {
      questionId: input.questionId,
      transcript: input.transcript,
      audioUrl: input.audioUrl,
      aiFeedback: input.aiFeedback ?? null,
      score: input.score ?? null,
    },
  });

  try {
    const session = await getInterviewSession(sessionId, userId);
    const insights = await generateInterviewSessionInsights(session);
    if (insights) {
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          summary: insights.summary,
          recommendation: insights.recommendation,
        },
      });
    }
  } catch (error) {
    console.error("Interview insight generation failed", error);
  }

  return response;
}

export async function assertSessionOwnership(sessionId: string, userId: string) {
  const session = await prisma.interviewSession.findFirst({
    where: { id: sessionId, userId },
    select: { id: true },
  });

  if (!session) {
    throw new Error("Interview session not found");
  }
}

export async function assertQuestionOwnership(questionId: string, sessionId: string, userId: string) {
  const question = await prisma.interviewQuestion.findFirst({
    where: { id: questionId, session: { id: sessionId, userId } },
    select: { id: true },
  });

  if (!question) {
    throw new Error("Question not found for this session");
  }
}
