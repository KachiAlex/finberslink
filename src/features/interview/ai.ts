import { z } from "zod";
import { Prisma } from "@prisma/client";
import { toFile } from "openai/uploads";

import type { InterviewSessionPayload } from "./service";
import { getOpenAIClient } from "@/lib/ai/client";

const insightSchema = z.object({
  summary: z.string().min(10),
  recommendation: z.string().min(10),
});

function extractJsonPayload(raw: string) {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (match) {
    return match[1].trim();
  }
  return raw.trim();
}

export async function transcribeInterviewAudio(options: {
  buffer: Buffer;
  filename: string;
  mimeType?: string;
}) {
  const openai = getOpenAIClient();
  const file = await toFile(options.buffer, options.filename || "interview-response.webm", {
    type: options.mimeType ?? "audio/webm",
  });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "gpt-4o-mini-transcribe",
    temperature: 0,
  });

  return transcription.text?.trim() ?? "";
}

const responseFeedbackSchema = z.object({
  aiFeedback: z.string().min(1),
  score: z.number().min(1).max(5),
});

export async function generateResponseFeedback(options: {
  prompt?: string | null;
  transcript: string;
  rubric?: Prisma.InputJsonValue | null;
  targetRole?: string | null;
}) {
  const { prompt, transcript, rubric, targetRole } = options;

  const openai = getOpenAIClient();

  const contextParts = [
    targetRole ? `Target role: ${targetRole}` : null,
    prompt ? `Question: ${prompt}` : null,
    rubric ? `Rubric: ${JSON.stringify(rubric)}` : null,
  ].filter(Boolean);

  const userContent = `You are an interview grader. Given the following question context and a candidate transcript, produce a concise coaching feedback string and a numeric score from 1 to 5 (5 = excellent).

Context:
${contextParts.join("\n") || "General"}

Transcript:
${transcript}

Return a JSON object formatted as:\n{ "aiFeedback": "...", "score": 1 }
Only return the JSON object and nothing else.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: "You are a succinct, objective grader who explains strengths and improvements." },
      { role: "user", content: userContent },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "";
  const candidateJson = (() => {
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    return match ? match[1].trim() : raw.trim();
  })();

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidateJson);
  } catch (err) {
    console.error("Response feedback JSON parse failed", err, candidateJson);
    throw new Error("Response feedback parsing failed");
  }

  const result = responseFeedbackSchema.safeParse(parsed);
  if (!result.success) {
    console.error("Response feedback schema invalid", result.error.flatten());
    throw new Error("Response feedback schema invalid");
  }

  return result.data as { aiFeedback: string; score: number };
}

export async function generateInterviewSessionInsights(session: InterviewSessionPayload) {
  const transcriptBlocks = session.questions.flatMap((question) =>
    question.responses.map((response) => {
      return `Question: ${question.prompt}\nTranscript: ${response.transcript}\nAI Feedback: ${response.aiFeedback || "N/A"}\nSelf score: ${
        typeof response.score === "number" ? response.score : "Unscored"
      }/5`;
    }),
  );

  if (!transcriptBlocks.length) {
    return null;
  }

  const contextParts = [
    `Target Role: ${session.targetRole}`,
    session.resume?.title ? `Resume context: ${session.resume.title}` : null,
    session.jobOpportunity?.title ? `Linked role: ${session.jobOpportunity.title}` : null,
  ].filter(Boolean);

  const prompt = `You are an expert behavioral interview coach. Review the following recent mock interview session data and provide coaching insights.

Context:
${contextParts.join("\n") || "General interview practice"}

Transcripts & Feedback:
${transcriptBlocks.join("\n\n")}

Return a JSON object with two string fields:
{
  "summary": "A concise synthesis (<= 3 sentences) of how the candidate performed overall",
  "recommendation": "Actionable next steps (<= 4 sentences) tailored to the role"
}`;

  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content:
          "You are an encouraging but direct interview coach who produces structured, actionable coaching summaries in JSON.",
      },
      { role: "user", content: prompt },
    ],
  });

  const rawContent = response.choices[0]?.message?.content ?? "";
  const candidateJson = extractJsonPayload(rawContent);

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidateJson);
  } catch (error) {
    console.error("Interview insight JSON parse failed", error, candidateJson);
    throw new Error("Interview insight parsing failed");
  }

  const result = insightSchema.safeParse(parsed);
  if (!result.success) {
    console.error("Interview insight schema invalid", result.error.flatten());
    throw new Error("Interview insight schema invalid");
  }

  return result.data;
}
