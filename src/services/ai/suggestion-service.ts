/**
 * AI Suggestion Service
 * 
 * Integrates with OpenAI API to generate intelligent resume improvement suggestions.
 * Provides resume analysis, suggestion generation, and caching.
 */

import { OpenAI } from 'openai';
import { Logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

const logger = new Logger('SuggestionService');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ResumeSectionData {
  summary?: string;
  experiences?: Array<{
    title: string;
    company: string;
    description?: string;
    achievements?: string[];
  }>;
  education?: Array<{
    school: string;
    degree: string;
    field: string;
  }>;
  skills?: string[];
}

export interface GeneratedSuggestion {
  id: string;
  category: 'summary' | 'achievement' | 'skill' | 'experience';
  originalText: string;
  suggestedText: string;
  explanation: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  targetField: string;
}

export interface SuggestionAnalysisResult {
  suggestions: GeneratedSuggestion[];
  analysisMetadata: {
    completedAt: string;
    modelUsed: string;
    tokensUsed: number;
  };
}

// Rate limiting: 10 requests per user per hour
const RATE_LIMIT_REQUESTS = 10;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

// Cache TTL: 24 hours
const CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Check rate limit for user
 */
async function checkRateLimit(userId: string): Promise<boolean> {
  try {
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW);

    const recentSuggestions = await prisma.resumeSuggestion.count({
      where: {
        resume: {
          userId,
        },
        createdAt: {
          gte: oneHourAgo,
        },
      },
    });

    return recentSuggestions < RATE_LIMIT_REQUESTS;
  } catch (error) {
    logger.error('Error checking rate limit', error);
    return false;
  }
}

/**
 * Generate suggestions for resume summary
 */
async function generateSummarySuggestions(summary: string): Promise<GeneratedSuggestion[]> {
  const prompt = `Analyze this resume summary and provide 2-3 specific, actionable suggestions to improve it. Focus on clarity, impact, and relevance.

Summary: "${summary}"

For each suggestion, provide:
1. The original text
2. The suggested improvement
3. A brief explanation of why this improves the summary
4. Confidence level (high/medium/low)

Format as JSON array with objects containing: originalText, suggestedText, explanation, confidenceLevel`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not parse suggestions from response');
    }

    const parsedSuggestions = JSON.parse(jsonMatch[0]);

    return parsedSuggestions.map((s: any, index: number) => ({
      id: `summary-${index}`,
      category: 'summary' as const,
      originalText: s.originalText,
      suggestedText: s.suggestedText,
      explanation: s.explanation,
      confidenceLevel: s.confidenceLevel || 'medium',
      targetField: 'summary',
    }));
  } catch (error) {
    logger.error('Error generating summary suggestions', error);
    throw error;
  }
}

/**
 * Generate suggestions for achievements using STAR method
 */
async function generateAchievementSuggestions(
  experiences: ResumeSectionData['experiences']
): Promise<GeneratedSuggestion[]> {
  if (!experiences || experiences.length === 0) {
    return [];
  }

  const experienceText = experiences
    .map(
      (exp, idx) =>
        `Experience ${idx + 1}: ${exp.title} at ${exp.company}
    Description: ${exp.description || 'N/A'}
    Achievements: ${exp.achievements?.join(', ') || 'N/A'}`
    )
    .join('\n\n');

  const prompt = `Review these work experiences and suggest improvements using the STAR method (Situation, Task, Action, Result). Provide 2-3 specific suggestions to make achievements more impactful.

${experienceText}

For each suggestion, provide:
1. The original achievement text
2. The improved version using STAR method
3. Explanation of the improvement
4. Confidence level (high/medium/low)
5. Which experience index it applies to

Format as JSON array with objects containing: originalText, suggestedText, explanation, confidenceLevel, experienceIndex`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not parse suggestions from response');
    }

    const parsedSuggestions = JSON.parse(jsonMatch[0]);

    return parsedSuggestions.map((s: any, index: number) => ({
      id: `achievement-${index}`,
      category: 'achievement' as const,
      originalText: s.originalText,
      suggestedText: s.suggestedText,
      explanation: s.explanation,
      confidenceLevel: s.confidenceLevel || 'medium',
      targetField: `experience[${s.experienceIndex}].achievements`,
    }));
  } catch (error) {
    logger.error('Error generating achievement suggestions', error);
    throw error;
  }
}

/**
 * Generate suggestions for skills
 */
async function generateSkillSuggestions(skills: string[]): Promise<GeneratedSuggestion[]> {
  if (!skills || skills.length === 0) {
    return [];
  }

  const prompt = `Review this list of skills and suggest improvements. Recommend:
1. Skills that might be missing based on common industry standards
2. Skills that could be better organized or renamed for clarity
3. Skills that could be more specific or technical

Skills: ${skills.join(', ')}

For each suggestion, provide:
1. The original skill or "ADD" if it's a new skill
2. The suggested skill
3. Explanation
4. Confidence level (high/medium/low)

Format as JSON array with objects containing: originalText, suggestedText, explanation, confidenceLevel`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not parse suggestions from response');
    }

    const parsedSuggestions = JSON.parse(jsonMatch[0]);

    return parsedSuggestions.map((s: any, index: number) => ({
      id: `skill-${index}`,
      category: 'skill' as const,
      originalText: s.originalText,
      suggestedText: s.suggestedText,
      explanation: s.explanation,
      confidenceLevel: s.confidenceLevel || 'medium',
      targetField: 'skills',
    }));
  } catch (error) {
    logger.error('Error generating skill suggestions', error);
    throw error;
  }
}

/**
 * Generate suggestions for experience descriptions
 */
async function generateExperienceSuggestions(
  experiences: ResumeSectionData['experiences']
): Promise<GeneratedSuggestion[]> {
  if (!experiences || experiences.length === 0) {
    return [];
  }

  const experienceText = experiences
    .map(
      (exp, idx) =>
        `Experience ${idx + 1}: ${exp.title} at ${exp.company}
    Current description: ${exp.description || 'No description'}`
    )
    .join('\n\n');

  const prompt = `Review these job descriptions and suggest improvements. Make them more impactful, specific, and achievement-focused.

${experienceText}

For each suggestion, provide:
1. The original description
2. The improved version
3. Explanation of improvements
4. Confidence level (high/medium/low)
5. Which experience index it applies to

Format as JSON array with objects containing: originalText, suggestedText, explanation, confidenceLevel, experienceIndex`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not parse suggestions from response');
    }

    const parsedSuggestions = JSON.parse(jsonMatch[0]);

    return parsedSuggestions.map((s: any, index: number) => ({
      id: `experience-${index}`,
      category: 'experience' as const,
      originalText: s.originalText,
      suggestedText: s.suggestedText,
      explanation: s.explanation,
      confidenceLevel: s.confidenceLevel || 'medium',
      targetField: `experience[${s.experienceIndex}].description`,
    }));
  } catch (error) {
    logger.error('Error generating experience suggestions', error);
    throw error;
  }
}

/**
 * Generate all suggestions for a resume
 */
export async function generateSuggestions(
  resumeId: string,
  userId: string,
  resumeData: ResumeSectionData,
  analysisType: 'full' | 'summary' | 'achievements' | 'skills' | 'experience' = 'full'
): Promise<SuggestionAnalysisResult> {
  try {
    // Check rate limit
    const withinLimit = await checkRateLimit(userId);
    if (!withinLimit) {
      throw new Error('Rate limit exceeded. Maximum 10 suggestions per hour.');
    }

    const suggestions: GeneratedSuggestion[] = [];
    let tokensUsed = 0;

    // Generate suggestions based on analysis type
    if (analysisType === 'full' || analysisType === 'summary') {
      if (resumeData.summary) {
        const summaryS = await generateSummarySuggestions(resumeData.summary);
        suggestions.push(...summaryS);
        tokensUsed += 500; // Approximate
      }
    }

    if (analysisType === 'full' || analysisType === 'achievements') {
      if (resumeData.experiences) {
        const achievementS = await generateAchievementSuggestions(resumeData.experiences);
        suggestions.push(...achievementS);
        tokensUsed += 750; // Approximate
      }
    }

    if (analysisType === 'full' || analysisType === 'skills') {
      if (resumeData.skills) {
        const skillS = await generateSkillSuggestions(resumeData.skills);
        suggestions.push(...skillS);
        tokensUsed += 500; // Approximate
      }
    }

    if (analysisType === 'full' || analysisType === 'experience') {
      if (resumeData.experiences) {
        const experienceS = await generateExperienceSuggestions(resumeData.experiences);
        suggestions.push(...experienceS);
        tokensUsed += 750; // Approximate
      }
    }

    logger.info(`Generated ${suggestions.length} suggestions for resume ${resumeId}`);

    return {
      suggestions,
      analysisMetadata: {
        completedAt: new Date().toISOString(),
        modelUsed: 'gpt-4',
        tokensUsed,
      },
    };
  } catch (error) {
    logger.error('Error generating suggestions', error);
    throw error;
  }
}

/**
 * Save suggestions to database
 */
export async function saveSuggestions(
  resumeId: string,
  suggestions: GeneratedSuggestion[]
): Promise<void> {
  try {
    await Promise.all(
      suggestions.map(suggestion =>
        prisma.resumeSuggestion.create({
          data: {
            resumeId,
            category: suggestion.category,
            originalText: suggestion.originalText,
            suggestedText: suggestion.suggestedText,
            explanation: suggestion.explanation,
            confidenceLevel: suggestion.confidenceLevel,
            targetField: suggestion.targetField,
            status: 'pending',
          },
        })
      )
    );

    logger.info(`Saved ${suggestions.length} suggestions for resume ${resumeId}`);
  } catch (error) {
    logger.error('Error saving suggestions', error);
    throw error;
  }
}

/**
 * Get pending suggestions for a resume
 */
export async function getPendingSuggestions(resumeId: string): Promise<GeneratedSuggestion[]> {
  try {
    const suggestions = await prisma.resumeSuggestion.findMany({
      where: {
        resumeId,
        status: 'pending',
      },
      orderBy: { createdAt: 'desc' },
    });

    return suggestions.map(s => ({
      id: s.id,
      category: s.category as any,
      originalText: s.originalText,
      suggestedText: s.suggestedText,
      explanation: s.explanation || '',
      confidenceLevel: s.confidenceLevel as any,
      targetField: s.targetField || '',
    }));
  } catch (error) {
    logger.error('Error getting pending suggestions', error);
    throw error;
  }
}

/**
 * Clear cached suggestions for a resume
 */
export async function clearSuggestionCache(resumeId: string): Promise<void> {
  try {
    await prisma.resumeSuggestion.deleteMany({
      where: {
        resumeId,
        status: 'pending',
        createdAt: {
          lt: new Date(Date.now() - CACHE_TTL),
        },
      },
    });

    logger.info(`Cleared cached suggestions for resume ${resumeId}`);
  } catch (error) {
    logger.error('Error clearing suggestion cache', error);
    throw error;
  }
}
