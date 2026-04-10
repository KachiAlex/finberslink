import { z } from "zod";

import { getOpenAIClient } from "./client";

export interface ResumeSummaryRequest {
  currentSummary?: string;
  experience: string[];
  skills: string[];
  targetRole?: string;
}

const ATS_FALLBACK_STOPWORDS = new Set([
  "and",
  "with",
  "that",
  "this",
  "will",
  "your",
  "from",
  "team",
  "into",
  "work",
  "able",
  "have",
  "experience",
  "skills",
  "skill",
  "role",
  "job",
  "description",
  "company",
  "about",
  "need",
  "must",
  "responsibilities",
  "requirements",
]);

function capitalize(word: string) {
  if (!word) {
    return word;
  }
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function extractJobKeywords(text: string) {
  const rawKeywords = text.match(/\b[a-z]{4,}\b/gi) ?? [];
  return Array.from(
    new Set(
      rawKeywords
        .map((keyword) => keyword.toLowerCase())
        .filter((keyword) => !ATS_FALLBACK_STOPWORDS.has(keyword)),
    ),
  );
}

function buildFallbackATSAnalysis(request: ATSAnalysisRequest): ATSAnalysisResponse {
  const jobKeywords = extractJobKeywords(request.jobDescription).slice(0, 16);
  const resumeText = request.resumeContent.toLowerCase();

  const strongMatches = jobKeywords
    .filter((keyword) => resumeText.includes(keyword))
    .map(capitalize)
    .slice(0, 6);

  const missingKeywords = jobKeywords
    .filter((keyword) => !resumeText.includes(keyword))
    .map(capitalize)
    .slice(0, 6);

  const coverage = strongMatches.length / Math.max(1, jobKeywords.length);
  const matchScore = Math.min(92, Math.max(38, Math.round(coverage * 100)));

  const recommendations = [
    `Mirror the language around ${missingKeywords.slice(0, 2).join(" and ") || "key responsibilities"} in your summary and bullets.`,
    "Elevate quantified achievements near the top of your experience section to boost relevance.",
    "Align project highlights with the KPIs called out in the job description.",
  ];

  const improvements = [
    missingKeywords.length
      ? `Incorporate references to ${missingKeywords.slice(0, 3).join(", ")} to improve keyword coverage.`
      : "Double-check the posting for emerging tools or workflows you can mention.",
    "Tighten bullet points so each one leads with an action verb and metric.",
    "Ensure your summary states the industries and team sizes you've impacted.",
  ];

  return {
    matchScore,
    missingKeywords: missingKeywords.length ? missingKeywords : ["Strategic Planning", "Stakeholder Management"],
    strongMatches: strongMatches.length ? strongMatches : ["Cross-functional Collaboration", "Process Optimization"],
    recommendations,
    improvements,
  };
}

function buildFallbackCoverLetter(resumeContent: string, jobDescription: string, companyName: string) {
  const resumeLines = resumeContent.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const personaLine = resumeLines[1] ?? resumeLines[0] ?? "Seasoned professional";
  const highlightLine = resumeLines.find((line) => line.includes("%") || line.includes("$")) ??
    "Delivered measurable impact across cross-functional teams.";

  const jobLines = jobDescription.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const roleGuess = jobLines[0]?.slice(0, 80) || "this opportunity";
  const companyLabel = companyName || "your team";

  return `Dear Hiring Manager at ${companyLabel},

I am excited to express my interest in ${roleGuess}. Throughout my career as ${personaLine.toLowerCase()}, I have helped teams ship complex initiatives while keeping stakeholders aligned and informed.

${highlightLine}

The responsibilities outlined in the job description mirror the work I enjoy most: translating ambiguous goals into prioritised roadmaps, partnering closely with cross-functional peers, and measuring results with rigor. I am particularly drawn to ${companyLabel}'s focus on innovative execution and would love to contribute my playbook to accelerate those priorities.

Thank you for considering my application. I would welcome the opportunity to discuss how my background can advance ${companyLabel}'s goals.

Best regards,
Your next hire`; }

function buildFallbackSkillAnalysis(request: SkillAnalysisRequest): SkillAnalysisResponse {
  const baseText = [
    ...request.experience,
    request.jobDescription ?? "",
    request.targetRole ?? "",
  ]
    .join(" \n ")
    .toLowerCase();

  const hardMatches: Array<[string, string]> = [
    ["react", "React"],
    ["node", "Node.js"],
    ["python", "Python"],
    ["sql", "SQL"],
    ["typescript", "TypeScript"],
    ["aws", "AWS"],
    ["design", "Product Design"],
    ["marketing", "Growth Marketing"],
    ["data", "Data Analysis"],
    ["salesforce", "Salesforce"],
  ];

  const softMatches: Array<[string, string]> = [
    ["lead", "Leadership"],
    ["mentor", "Mentorship"],
    ["collaborat", "Collaboration"],
    ["stakeholder", "Stakeholder Management"],
    ["communicat", "Communication"],
    ["strateg", "Strategic Thinking"],
    ["deliver", "Execution"],
  ];

  const suggestedPool: Array<[string, string]> = [
    ["product", "Product Strategy"],
    ["engineer", "System Design"],
    ["design", "User Research"],
    ["marketing", "Lifecycle Marketing"],
    ["sales", "Negotiation"],
  ];

  const collectMatches = (entries: Array<[string, string]>) => {
    const set = new Set<string>();
    for (const [needle, value] of entries) {
      if (baseText.includes(needle)) {
        set.add(value);
      }
    }
    return Array.from(set);
  };

  const hardSkills = collectMatches(hardMatches);
  const softSkills = collectMatches(softMatches);
  const suggestedSkills = collectMatches(suggestedPool);

  if (hardSkills.length === 0) {
    hardSkills.push("Project Management", "Data Analysis");
  }

  if (softSkills.length === 0) {
    softSkills.push("Collaboration", "Problem Solving");
  }

  if (suggestedSkills.length === 0) {
    suggestedSkills.push("Stakeholder Management", "Process Optimization");
  }

  const prioritySkills = Array.from(new Set([...hardSkills.slice(0, 3), ...softSkills.slice(0, 2)]));

  return {
    hardSkills,
    softSkills,
    suggestedSkills,
    prioritySkills: prioritySkills.length ? prioritySkills : hardSkills.slice(0, 3),
  };
}

function buildFallbackBulletPoints(request: BulletPointRequest) {
  const normalized = (request.rawDescription ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^[•-\d.\s]+/, "").trim())
    .filter(Boolean);

  if (normalized.length > 0) {
    return normalized.slice(0, 4).map((line) => {
      const sentence = line.charAt(0).toUpperCase() + line.slice(1);
      return sentence.endsWith(".") ? sentence : `${sentence}.`;
    });
  }

  const roleLabel = request.role || "the role";
  const companyLabel = request.company || "the company";

  return [
    `Led key initiatives at ${companyLabel}, elevating performance across teams.`,
    `Delivered measurable outcomes in the ${roleLabel} role despite resource constraints.`,
    `Collaborated cross-functionally to keep ${companyLabel} projects on schedule and within scope.`,
    `Documented wins to keep stakeholders aligned on ${roleLabel} priorities.`,
  ];
}

export interface BulletPointRequest {
  company: string;
  role: string;
  duration: string;
  rawDescription?: string;
  targetRole?: string;
}

export interface BulletPointResponse {
  bulletPoints: string[];
  usedFallback: boolean;
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

export interface SkillAnalysisResult {
  analysis: SkillAnalysisResponse;
  usedFallback: boolean;
}

const atsAnalysisResponseSchema = z.object({
  matchScore: z.number().min(0).max(100),
  missingKeywords: z.array(z.string()),
  strongMatches: z.array(z.string()),
  recommendations: z.array(z.string()),
  improvements: z.array(z.string()),
});

export type ATSAnalysisResponse = z.infer<typeof atsAnalysisResponseSchema>;

export interface ATSAnalysisResult {
  analysis: ATSAnalysisResponse;
  usedFallback: boolean;
}

export interface CoverLetterResponse {
  coverLetter: string;
  usedFallback: boolean;
}

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

function isQuotaOrRateLimitError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    status?: number;
    code?: string;
    type?: string;
    error?: { code?: string; type?: string };
  };

  if (candidate.status === 429) {
    return true;
  }

  const code = candidate.code || candidate.type || candidate.error?.code || candidate.error?.type;
  if (!code) {
    return false;
  }

  return code === "insufficient_quota" || code === "rate_limit_exceeded" || code.includes("quota");
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

function buildFallbackAchievements(request: AchievementGenerationRequest) {
  const roleLabel = request.jobTitle?.trim() || "the role";
  const normalizedHighlights = (request.contextHighlights ?? [])
    .map((highlight) => highlight?.replace(/^[•-\d.\s]+/, "").trim())
    .filter(Boolean);

  if (normalizedHighlights.length > 0) {
    return normalizedHighlights.slice(0, 4).map((highlight) => {
      const sentence = highlight.charAt(0).toUpperCase() + highlight.slice(1);
      const startsWithVerb = /^(Led|Built|Managed|Delivered|Created|Optimized|Spearheaded|Reduced|Improved|Developed)/i.test(
        sentence,
      );
      return startsWithVerb ? sentence : `Delivered impact by ${sentence.replace(/^Delivered\simpact\sby\s/i, "")}`;
    });
  }

  return [
    `Spearheaded high-impact initiatives as ${roleLabel}, translating strategy into measurable outcomes.`,
    "Optimized cross-functional workflows to accelerate delivery timelines by double digits.",
    "Leveraged data-driven insights to prioritize roadmaps and exceed KPI targets.",
    "Mentored teammates and codified best practices to elevate execution quality.",
  ];
}

export interface ResumeSummaryResponse {
  summary: string;
  usedFallback: boolean;
}

export async function optimizeResumeSummary(request: ResumeSummaryRequest): Promise<ResumeSummaryResponse> {
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

    const aiSummary = response.choices[0]?.message?.content?.trim();
    if (!aiSummary) {
      return { summary: buildFallbackSummary(request), usedFallback: true };
    }

    return { summary: aiSummary, usedFallback: false };
  } catch (error) {
    console.error("Error optimizing resume summary:", error);
    return { summary: buildFallbackSummary(request), usedFallback: true };
  }
}

export async function generateBulletPoints(request: BulletPointRequest): Promise<BulletPointResponse> {
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
    const bulletPoints = content
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(Boolean);

    if (bulletPoints.length === 0) {
      throw new Error("No bullet points generated");
    }

    return { bulletPoints, usedFallback: false };
  } catch (error) {
    console.error("Error generating bullet points:", error);
    if (isQuotaOrRateLimitError(error)) {
      return { bulletPoints: buildFallbackBulletPoints(request), usedFallback: true };
    }

    throw new Error("Failed to generate bullet points");
  }
}

export interface AchievementGenerationResponse {
  achievements: string[];
  usedFallback: boolean;
}

export async function generateAchievementsFromContext(
  request: AchievementGenerationRequest,
): Promise<AchievementGenerationResponse> {
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

    return { achievements: bullets, usedFallback: false };
  } catch (error) {
    console.error("Error generating AI achievements:", error);
    if (isQuotaOrRateLimitError(error)) {
      return { achievements: buildFallbackAchievements(request), usedFallback: true };
    }

    throw new Error("Failed to generate achievements");
  }
}

export async function analyzeSkills(request: SkillAnalysisRequest): Promise<SkillAnalysisResult> {
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
    const analysis = parseStructuredResponse(content, skillAnalysisResponseSchema, "skill analysis");
    return { analysis, usedFallback: false };
  } catch (error) {
    console.error("Error analyzing skills:", error);
    if (isQuotaOrRateLimitError(error)) {
      return { analysis: buildFallbackSkillAnalysis(request), usedFallback: true };
    }

    throw new Error("Failed to analyze skills");
  }
}

export async function analyzeATSMatch(request: ATSAnalysisRequest): Promise<ATSAnalysisResult> {
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
    return {
      analysis: parseStructuredResponse(content, atsAnalysisResponseSchema, "ATS analysis"),
      usedFallback: false,
    };
  } catch (error) {
    console.error("Error analyzing ATS match:", error);
    if (isQuotaOrRateLimitError(error)) {
      return { analysis: buildFallbackATSAnalysis(request), usedFallback: true };
    }

    throw new Error("Failed to analyze ATS match");
  }
}

export async function generateCoverLetter(
  resumeContent: string,
  jobDescription: string,
  companyName: string,
): Promise<CoverLetterResponse> {
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

    const coverLetter = response.choices[0]?.message?.content?.trim();
    if (!coverLetter) {
      throw new Error("Empty cover letter response");
    }

    return { coverLetter, usedFallback: false };
  } catch (error) {
    console.error("Error generating cover letter:", error);
    if (isQuotaOrRateLimitError(error)) {
      return {
        coverLetter: buildFallbackCoverLetter(resumeContent, jobDescription, companyName),
        usedFallback: true,
      };
    }

    throw new Error("Failed to generate cover letter");
  }
}
