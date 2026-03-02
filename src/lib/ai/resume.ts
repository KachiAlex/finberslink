import OpenAI from "openai";

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

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

export interface SkillAnalysisRequest {
  experience: string[];
  targetRole?: string;
  jobDescription?: string;
}

export interface ATSAnalysisRequest {
  resumeContent: string;
  jobDescription: string;
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

    return response.choices[0]?.message?.content?.trim() || "";
  } catch (error) {
    console.error("Error optimizing resume summary:", error);
    throw new Error("Failed to optimize resume summary");
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

export async function analyzeSkills(request: SkillAnalysisRequest) {
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

    const content = response.choices[0]?.message?.content?.trim() || "";
    return JSON.parse(content);
  } catch (error) {
    console.error("Error analyzing skills:", error);
    throw new Error("Failed to analyze skills");
  }
}

export async function analyzeATSMatch(request: ATSAnalysisRequest) {
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

    const content = response.choices[0]?.message?.content?.trim() || "";
    return JSON.parse(content);
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
