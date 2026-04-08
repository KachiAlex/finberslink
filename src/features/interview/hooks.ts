import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

// Avoid importing Prisma client on the browser — define lightweight enum unions instead.
const sessionStatusValues = ["PENDING", "ACTIVE", "COMPLETED", "CANCELLED"] as const;
const flowStepValues = ["QUESTION_PHASE", "FEEDBACK_PHASE", "RATING_PHASE"] as const;

export type InterviewSessionStatus = (typeof sessionStatusValues)[number];
export type InterviewFlowStep = (typeof flowStepValues)[number];

const InterviewResponseSchema = z.object({
  id: z.string(),
  questionId: z.string(),
  audioUrl: z.string().nullable(),
  transcript: z.string(),
  aiFeedback: z.string().nullable(),
  score: z.number().nullable(),
  submittedAt: z.string(),
});

const InterviewQuestionSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  sequence: z.number(),
  prompt: z.string(),
  rubric: z.any().nullable(),
  createdAt: z.string(),
  responses: z.array(InterviewResponseSchema),
});

const ResumeSnapshotSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    slug: z.string().nullable(),
  })
  .nullable();

const JobSnapshotSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    company: z.string(),
    slug: z.string().nullable(),
  })
  .nullable();

const InterviewSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  resumeId: z.string().nullable(),
  jobOpportunityId: z.string().nullable(),
  targetRole: z.string(),
  status: z.enum(sessionStatusValues),
  currentStep: z.enum(flowStepValues),
  summary: z.string().nullable(),
  rating: z.number().nullable(),
  recommendation: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  questions: z.array(InterviewQuestionSchema),
  resume: ResumeSnapshotSchema,
  jobOpportunity: JobSnapshotSchema,
});

const sessionsResponseSchema = z.object({
  sessions: z.array(InterviewSessionSchema),
});

const sessionResponseSchema = z.object({
  session: InterviewSessionSchema,
});

const questionResponseSchema = z.object({
  question: InterviewQuestionSchema,
});

const responseRecordSchema = z.object({
  response: InterviewResponseSchema,
});

const audioUploadResponseSchema = z.object({
  audioUrl: z.string().url(),
  transcript: z.string(),
});

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = typeof data?.error === "string" ? data.error : "Request failed";
    throw new Error(message);
  }

  return data;
}

export type InterviewSession = z.infer<typeof InterviewSessionSchema>;
export type InterviewQuestion = z.infer<typeof InterviewQuestionSchema>;
export type InterviewResponse = z.infer<typeof InterviewResponseSchema>;

export interface CreateInterviewSessionBody {
  targetRole: string;
  resumeId?: string;
  jobOpportunityId?: string;
  initialQuestion?: {
    prompt: string;
    rubric?: unknown;
  };
}

export interface UpdateInterviewSessionBody {
  status?: InterviewSessionStatus;
  currentStep?: InterviewFlowStep;
  summary?: string | null;
  recommendation?: string | null;
  rating?: number | null;
}

export interface AddInterviewQuestionBody {
  sessionId: string;
  prompt: string;
  sequence?: number;
  rubric?: unknown;
}

export interface RecordInterviewResponseBody {
  sessionId: string;
  questionId: string;
  transcript: string;
  audioUrl?: string;
  aiFeedback?: string;
  score?: number;
}

export interface UploadInterviewAudioBody {
  questionId: string;
  file: File;
}

export function useInterviewSessions() {
  return useQuery({
    queryKey: ["interview", "sessions"],
    queryFn: async () => {
      const payload = await requestJson<unknown>("/api/interview-sessions");
      return sessionsResponseSchema.parse(payload).sessions;
    },
  });
}

export function useUploadInterviewAudio(sessionId: string | null) {
  return useMutation({
    mutationFn: async ({ questionId, file }: UploadInterviewAudioBody) => {
      if (!sessionId) {
        throw new Error("Session not ready for upload");
      }

      const formData = new FormData();
      formData.append("questionId", questionId);
      formData.append("file", file);

      const response = await fetch(`/api/interview-sessions/${sessionId}/responses/audio`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = typeof payload?.error === "string" ? payload.error : "Audio upload failed";
        throw new Error(message);
      }

      return audioUploadResponseSchema.parse(payload);
    },
  });
}

export function useInterviewSession(sessionId: string | null) {
  return useQuery({
    queryKey: ["interview", "session", sessionId],
    enabled: Boolean(sessionId),
    queryFn: async () => {
      const payload = await requestJson<unknown>(`/api/interview-sessions/${sessionId}`);
      return sessionResponseSchema.parse(payload).session;
    },
  });
}

export function useCreateInterviewSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateInterviewSessionBody) => {
      const payload = await requestJson<unknown>("/api/interview-sessions", {
        method: "POST",
        body: JSON.stringify(body),
      });

      return sessionResponseSchema.parse(payload).session;
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["interview", "sessions"] });
      queryClient.setQueryData(["interview", "session", session.id], session);
    },
  });
}

export function useUpdateInterviewSession(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: UpdateInterviewSessionBody) => {
      const payload = await requestJson<unknown>(`/api/interview-sessions/${sessionId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });

      return sessionResponseSchema.parse(payload).session;
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["interview", "sessions"] });
      queryClient.setQueryData(["interview", "session", session.id], session);
    },
  });
}

export function useAddInterviewQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: AddInterviewQuestionBody) => {
      const payload = await requestJson<unknown>(`/api/interview-sessions/${body.sessionId}/questions`, {
        method: "POST",
        body: JSON.stringify({ prompt: body.prompt, sequence: body.sequence, rubric: body.rubric }),
      });

      return questionResponseSchema.parse(payload).question;
    },
    onSuccess: (_question, variables) => {
      queryClient.invalidateQueries({ queryKey: ["interview", "session", variables.sessionId] });
    },
  });
}

export function useRecordInterviewResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: RecordInterviewResponseBody) => {
      const payload = await requestJson<unknown>(`/api/interview-sessions/${body.sessionId}/responses`, {
        method: "POST",
        body: JSON.stringify({
          questionId: body.questionId,
          transcript: body.transcript,
          audioUrl: body.audioUrl,
          aiFeedback: body.aiFeedback,
          score: body.score,
        }),
      });

      return responseRecordSchema.parse(payload).response;
    },
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["interview", "session", variables.sessionId] });
    },
  });
}
