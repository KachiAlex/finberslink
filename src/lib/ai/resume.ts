import { z } from "zod";

import { getOpenAIClient } from "@/lib/ai/client";

export interface ResumeSummaryRequest {
  currentSummary?: string;
  experience: string[];
  skills: string[];
  targetRole?: string;
}

export interface BulletPointRequest {
  company: string;
  role: string;
  duration: string;
  rawDescription?: string;
  targetRole?: string;
}

export interface AchievementGenerationRequest {
  jobTitle: string;
  industry?: string;
  contextHighlights?: string[];
}

export interface SkillAnalysisRequest {
  experience: string[];
  targetRole?: string;
  jobDescription?: string;
}

export interface ATSAnalysisRequest {
  resumeContent: string;
  jobDescription: string;
}

const skillAnalysisResponseSchema = z.object({
  hardSkills: z.array(z.string()),
  softSkills: z.array(z.string()),
  suggestedSkills: z.array(z.string()),
  prioritySkills: z.array(z.string()),
});

export type SkillAnalysisResponse = z.infer<typeof skillAnalysisResponseSchema>;

const atsAnalysisResponseSchema = z.object({
  matchScore: z.number().min(0).max(100),
  missingKeywords: z.array(z.string()),
  strongMatches: z.array(z.string()),
  recommendations: z.array(z.string()),
  improvements: z.array(z.string()),
});

export type ATSAnalysisResponse = z.infer<typeof atsAnalysisResponseSchema>;

function extractJsonPayload(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    return fenced[1].trim();
  }
  return raw.trim();
}

function parseStructuredResponse<T>(rawContent: string, schema: z.ZodType<T>, context: string): T {
  const content = extractJsonPayload(rawContent);
  if (!content) {
    throw new Error(`Empty ${context} response`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (jsonError) {
    console.error(`Failed to parse ${context} JSON`, jsonError);
    throw new Error(`Failed to parse ${context} response`);
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    console.error(`Invalid ${context} response shape`, result.error.flatten());
    throw new Error(`Invalid ${context} response shape`);
  }

  return result.data;
}

function buildFallbackSummary(request: ResumeSummaryRequest) {
  const roleLabel = request.targetRole?.trim() || "versatile professional";
  const experienceHighlights = request.experience.filter(Boolean).slice(0, 2);
  const skills = request.skills.filter(Boolean).slice(0, 5);

  if (request.currentSummary?.trim()) {
    return request.currentSummary.trim();
  }

  const sentences = [
    `Results-driven ${roleLabel}${experienceHighlights.length ? " with" : " ready for"} ${
      experienceHighlights.length ? experienceHighlights.join("; ") : "proven ability to deliver impact"
    }`,
    skills.length ? `Key strengths include ${skills.join(", ")}` : null,
    "Committed to translating insights into measurable outcomes.",
  ].filter(Boolean);

  return sentences.join(". ");
}

export async function optimizeResumeSummary(request: ResumeSummaryRequest) {
  const { currentSummary, experience, skills, targetRole } = request;

  const prompt = `Please optimize this resume summary for a ${targetRole || 'professional'} role.

Current Summary: ${currentSummary || 'Not provided'}

Experience:
${experience.map(exp => `- ${exp}`).join('\n')}

Skills: ${skills.join(', ')}

Requirements:
1. Make it impactful and achievement-oriented
2. Keep it under 150 words
3. Include relevant keywords for ATS
4. Use strong action verbs
5. Quantify achievements where possible
6. Tailor it to the ${targetRole || 'professional'} role

Return only the optimized summary without any additional text.`;

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert resume writer and career coach. You specialize in creating compelling, ATS-optimized resume summaries."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content?.trim() || buildFallbackSummary(request);
  } catch (error) {
    console.error("Error optimizing resume summary:", error);
    return buildFallbackSummary(request);
  }
}

export async function generateBulletPoints(request: BulletPointRequest) {
  const { company, role, duration, rawDescription, targetRole } = request;

  const prompt = `Generate 3-5 impactful bullet points for this work experience:

Company: ${company}
Role: ${role}
Duration: ${duration}
Current Description: ${rawDescription || 'Not provided'}
Target Role: ${targetRole || 'Similar role'}

Requirements:
1. Start with strong action verbs (Led, Developed, Managed, etc.)
2. Include quantifiable achievements and metrics
3. Focus on results and impact
4. Keep each bullet point under 20 words
5. Include relevant keywords for ATS
6. Tailor for ${targetRole || 'career advancement'}

Format as a numbered list without any additional text.`;

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert resume writer who creates compelling, achievement-oriented bullet points."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content?.trim() || "";
    return content.split('\n').filter(line => line.trim()).map(line => line.replace(/^\d+\.\s*/, ''));
  } catch (error) {
    console.error("Error generating bullet points:", error);
    throw new Error("Failed to generate bullet points");
  }
}

export async function generateAchievementsFromContext(request: AchievementGenerationRequest) {
  const { jobTitle, industry, contextHighlights = [] } = request;

  const prompt = `Generate 4 concise, achievement-style resume bullets tailored for a ${jobTitle}${industry ? ` in the ${industry} industry` : ""}.

Context:
${contextHighlights.length ? contextHighlights.map((highlight, index) => `${index + 1}. ${highlight}`).join("\n") : "No additional context provided."}

Requirements:
1. Start each bullet with a strong action verb.
2. Highlight measurable impact; invent reasonable metrics if none are provided.
3. Keep each bullet under 22 words.
4. Use language relevant to ${industry || "the role"}.
5. Return plain bullets separated by new lines without numbering.`;

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an expert resume coach that crafts quantified, achievement-driven bullets tuned for ATS screening.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.65,
      max_tokens: 220,
    });

    const content = response.choices[0]?.message?.content?.trim() ?? "";
    const bullets = content
      .split("\n")
      .map((line) => line.replace(/^[-•\d.\s]+/, "").trim())
      .filter(Boolean);

    if (bullets.length === 0) {
      throw new Error("No achievements generated");
    }

    return bullets;
  } catch (error) {
    console.error("Error generating AI achievements:", error);
    throw new Error("Failed to generate achievements");
  }
}

export async function analyzeSkills(request: SkillAnalysisRequest): Promise<SkillAnalysisResponse> {
  const { experience, targetRole, jobDescription } = request;

  const prompt = `Analyze this experience and suggest relevant skills for a ${targetRole || 'professional'} role.

Experience:
${experience.map(exp => `- ${exp}`).join('\n')}

${jobDescription ? `Job Description: ${jobDescription}` : ''}

Requirements:
1. Identify hard skills (technical, tools, languages)
2. Identify soft skills (leadership, communication, etc.)
3. Suggest missing skills that would be valuable
4. Categorize skills by type
5. Prioritize most relevant skills

Format the response as JSON:
{
  "hardSkills": ["skill1", "skill2", ...],
  "softSkills": ["skill1", "skill2", ...],
  "suggestedSkills": ["skill1", "skill2", ...],
  "prioritySkills": ["skill1", "skill2", ...]
}`;

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert career analyst who identifies and categorizes professional skills."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content ?? "";
    return parseStructuredResponse(content, skillAnalysisResponseSchema, "skill analysis");
  } catch (error) {
    console.error("Error analyzing skills:", error);
    throw new Error("Failed to analyze skills");
  }
}

export async function analyzeATSMatch(request: ATSAnalysisRequest): Promise<ATSAnalysisResponse> {
  const { resumeContent, jobDescription } = request;

  const prompt = `Analyze this resume against the job description for ATS optimization.

Resume Content:
${resumeContent}

Job Description:
${jobDescription}

Requirements:
1. Calculate ATS match percentage (0-100)
2. Identify missing keywords from job description
3. Suggest improvements to increase match
4. Highlight strong matches
5. Provide actionable recommendations

Format the response as JSON:
{
  "matchScore": 85,
  "missingKeywords": ["keyword1", "keyword2", ...],
  "strongMatches": ["match1", "match2", ...],
  "recommendations": ["rec1", "rec2", ...],
  "improvements": ["imp1", "imp2", ...]
}`;

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert ATS (Applicant Tracking System) analyst who evaluates resume-job matches."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content ?? "";
    return parseStructuredResponse(content, atsAnalysisResponseSchema, "ATS analysis");
  } catch (error) {
    console.error("Error analyzing ATS match:", error);
    throw new Error("Failed to analyze ATS match");
  }
}

export async function generateCoverLetter(resumeContent: string, jobDescription: string, companyName: string) {
  const prompt = `Generate a professional cover letter based on this resume and job description.

Resume Content:
${resumeContent}

Job Description:
${jobDescription}

Company: ${companyName}

Requirements:
1. Keep it under 400 words
2. Highlight relevant experience and skills
3. Show enthusiasm for the role and company
4. Include a strong call to action
5. Use professional tone
6. Address potential gaps with positive framing

Format as a complete cover letter without any additional text.`;

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert cover letter writer who creates compelling, personalized cover letters."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 600,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content?.trim() || "";
  } catch (error) {
    console.error("Error generating cover letter:", error);
    throw new Error("Failed to generate cover letter");
  }
}
