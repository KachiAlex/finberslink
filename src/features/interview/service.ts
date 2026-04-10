import { Prisma } from "@prisma/client";
import type { InterviewFlowStep, InterviewSessionStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { generateInterviewSessionInsights, generateResponseFeedback } from "./ai";

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
  questionTemplateIds?: string[];
}

export async function createInterviewSession(input: CreateInterviewSessionInput) {
  const sequence = input.initialQuestion ? 1 : undefined;

  // Fetch question templates if provided
  let templateQuestions: any[] = [];
  if (input.questionTemplateIds && input.questionTemplateIds.length > 0) {
    templateQuestions = await prisma.questionTemplate.findMany({
      where: { id: { in: input.questionTemplateIds } },
      select: { id: true, text: true, rubric: true },
    });
  }

  // Build questions data
  const questionsData = [];
  
  // Add initial question if provided
  if (input.initialQuestion) {
    questionsData.push({
      prompt: input.initialQuestion.prompt,
      rubric: input.initialQuestion.rubric ?? Prisma.JsonNull,
      sequence: 1,
      templateId: undefined,
    });
  }

  // Add template questions
  templateQuestions.forEach((template, index) => {
    questionsData.push({
      prompt: template.text,
      rubric: template.rubric ?? Prisma.JsonNull,
      sequence: (input.initialQuestion ? 1 : 0) + index + 1,
      templateId: template.id,
    });
  });

  return prisma.interviewSession.create({
    data: {
      userId: input.userId,
      resumeId: input.resumeId,
      jobOpportunityId: input.jobOpportunityId,
      targetRole: input.targetRole,
      status: input.status ?? "ACTIVE",
      currentStep: input.currentStep ?? "QUESTION_PHASE",
      questions: questionsData.length > 0
        ? {
            create: questionsData,
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
      rubric: input.rubric ?? Prisma.JsonNull,
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

  // Try to generate AI grading for this response (non-blocking)
  let aiFeedback: string | null = input.aiFeedback ?? null;
  let score: number | null = input.score ?? null;

  try {
    const [question, sessionMeta] = await Promise.all([
      prisma.interviewQuestion.findUnique({ where: { id: input.questionId }, select: { prompt: true, rubric: true } }),
      prisma.interviewSession.findUnique({ where: { id: sessionId }, select: { targetRole: true } }),
    ]);

    try {
      const feedback = await generateResponseFeedback({
        prompt: question?.prompt ?? null,
        transcript: input.transcript,
        rubric: (question as any)?.rubric ?? null,
        targetRole: sessionMeta?.targetRole ?? null,
      });

      aiFeedback = feedback.aiFeedback;
      score = feedback.score;
    } catch (err) {
      console.error("Per-response AI feedback failed", err);
    }
  } catch (err) {
    console.error("Failed to fetch question/session metadata for AI grading", err);
  }

  const response = await prisma.interviewResponse.create({
    data: {
      questionId: input.questionId,
      transcript: input.transcript,
      audioUrl: input.audioUrl,
      aiFeedback: aiFeedback ?? null,
      score: score ?? null,
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
