import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export interface ResumeBulletGenerationInput {
  role: string;
  description?: string;
  company?: string;
  skills?: string[];
  context?: string;
}

export interface GeneratedBullets {
  bullets: string[];
  role: string;
  generatedAt: Date;
}

/**
 * Generate resume bullet points using AI
 * Creates actionable, achievement-focused bullet points for a resume section
 */
export async function generateResumeBullets(input: ResumeBulletGenerationInput): Promise<GeneratedBullets> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const prompt = buildBulletPrompt(input);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an expert resume writer. Generate 5 powerful, achievement-focused bullet points. Each bullet should be 1-2 lines, start with a strong action verb, and quantify impact where possible. Return only the bullets, one per line, without numbering.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content || "";
    const bullets = content
      .split("\n")
      .map((b) => b.trim())
      .filter((b) => b.length > 0 && !b.match(/^[\d.•-]/))
      .slice(0, 5);

    if (bullets.length === 0) {
      throw new Error("Failed to generate bullets");
    }

    return {
      bullets,
      role: input.role,
      generatedAt: new Date(),
    };
  } catch (error) {
    console.error("Error generating resume bullets:", error);
    throw error;
  }
}

/**
 * Generate a professional resume summary using AI
 */
export async function generateResumeSummary(input: {
  experience: string;
  skills: string[];
  targetRole?: string;
  industry?: string;
}): Promise<string> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const prompt = `Generate a concise, professional resume summary (2-3 sentences) for someone with the following profile:
Experience: ${input.experience}
Skills: ${input.skills.join(", ")}
${input.targetRole ? `Target Role: ${input.targetRole}` : ""}
${input.industry ? `Industry: ${input.industry}` : ""}

The summary should highlight key strengths and career goals, suitable for an ATS.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an expert resume writer. Generate a concise, ATS-optimized professional summary that showcases accomplishments and career goals.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Error generating resume summary:", error);
    throw error;
  }
}

/**
 * Optimize resume for ATS (Applicant Tracking System)
 */
export async function optimizeResumeForATS(input: {
  resumeText: string;
  targetJobDescription?: string;
}): Promise<{
  score: number;
  recommendations: string[];
  optimizedText: string;
}> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const prompt = `Analyze the following resume for ATS compatibility:
${input.resumeText}

${input.targetJobDescription ? `Job Description: ${input.targetJobDescription}` : ""}

Return a JSON object with:
1. "score" (0-100): ATS compatibility score
2. "recommendations": array of specific improvements
3. "optimizedText": improved version of the resume`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an ATS optimization expert. Analyze resumes for compatibility with applicant tracking systems and provide specific, actionable recommendations.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 1500,
    });

    const content = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);

    return {
      score: parsed.score || 0,
      recommendations: parsed.recommendations || [],
      optimizedText: parsed.optimizedText || input.resumeText,
    };
  } catch (error) {
    console.error("Error optimizing resume:", error);
    throw error;
  }
}

/**
 * Get resume by ID with full details
 */
export async function getResumeById(resumeId: string) {
  if (!resumeId) {
    throw new Error("resumeId is required");
  }

  return prisma.resume.findUnique({
    where: { id: resumeId },
    include: {
      user: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
    },
  });
}

/**
 * Get user's resumes
 */
export async function getUserResumes(userId: string) {
  if (!userId) {
    throw new Error("userId is required");
  }

  return prisma.resume.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * Update resume with generated content
 */
export async function updateResumeWithGeneratedContent(
  resumeId: string,
  content: {
    summary?: string;
    objective?: string;
  }
) {
  if (!resumeId) {
    throw new Error("resumeId is required");
  }

  const data: any = { updatedAt: new Date() };

  if (content.summary) {
    data.summary = content.summary;
  }
  if (content.objective) {
    data.objective = content.objective;
  }

  return prisma.resume.update({
    where: { id: resumeId },
    data,
  });
}

/**
 * Helper function to build bullet generation prompt
 */
function buildBulletPrompt(input: ResumeBulletGenerationInput): string {
  let prompt = `Generate 5 powerful resume bullet points for a ${input.role} position.`;

  if (input.company) {
    prompt += `\nCompany/Organization: ${input.company}`;
  }

  if (input.description) {
    prompt += ` \nJob Description/Context: ${input.description}`;
  }

  if (input.skills && input.skills.length > 0) {
    prompt += ` \nRelevant Skills: ${input.skills.join(", ")}`;
  }

  if (input.context) {
    prompt += ` \nAdditional Context: ${input.context}`;
  }

  prompt +=
    "\n\nMake the bullets achievement-focused, quantifiable where possible, and suitable for top career companies.";

  return prompt;
}

/**
 * Extract skills from resume text using AI
 */
export async function extractSkillsFromResume(resumeText: string): Promise<string[]> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const prompt = `Extract all technical skills and professional competencies from the following resume. Return as a comma-separated list.

Resume:
${resumeText}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an expert at extracting skills from resumes. Return only the skills as a comma-separated list, nothing else.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const content = response.choices[0].message.content || "";
    return content
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  } catch (error) {
    console.error("Error extracting skills:", error);
    return [];
  }
}
