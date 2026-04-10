import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface CreateQuestionTemplateInput {
  prompt: string;
  category: string; // "behavioral", "technical", "situational"
  difficulty: string; // "easy", "medium", "hard"
  targetRole: string;
  rubric?: Prisma.InputJsonValue;
  estimatedTime?: number; // seconds
}

/**
 * Get question templates by role
 * Returns 5-7 questions covering key competencies
 */
export async function getQuestionsByRole(role: string) {
  try {
    const templates = await prisma.questionTemplate.findMany({
      where: {
        targetRole: role,
      },
      orderBy: [
        { difficulty: "asc" }, // Easy first
        { category: "asc" },
      ],
      take: 7,
    });

    return templates;
  } catch (error) {
    console.error("Failed to get questions by role:", error);
    throw new Error(`Failed to get questions for role ${role}`);
  }
}

/**
 * Get all question templates with optional filters
 */
export async function getQuestionTemplates(filters?: {
  role?: string;
  category?: string;
  difficulty?: string;
}) {
  try {
    const where: Prisma.QuestionTemplateWhereInput = {};

    if (filters?.role) {
      where.targetRole = filters.role;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.difficulty) {
      where.difficulty = filters.difficulty;
    }

    const templates = await prisma.questionTemplate.findMany({
      where,
      orderBy: [
        { targetRole: "asc" },
        { difficulty: "asc" },
        { category: "asc" },
      ],
    });

    return templates;
  } catch (error) {
    console.error("Failed to get question templates:", error);
    throw new Error("Failed to get question templates");
  }
}

/**
 * Create custom question template
 */
export async function createQuestionTemplate(
  input: CreateQuestionTemplateInput,
) {
  try {
    // Validate input
    if (!input.prompt || input.prompt.trim().length < 5) {
      throw new Error("Question prompt must be at least 5 characters");
    }

    if (!input.targetRole || input.targetRole.trim().length === 0) {
      throw new Error("Target role is required");
    }

    const validCategories = ["behavioral", "technical", "situational"];
    if (!validCategories.includes(input.category)) {
      throw new Error(
        `Invalid category. Must be one of: ${validCategories.join(", ")}`,
      );
    }

    const validDifficulties = ["easy", "medium", "hard"];
    if (!validDifficulties.includes(input.difficulty)) {
      throw new Error(
        `Invalid difficulty. Must be one of: ${validDifficulties.join(", ")}`,
      );
    }

    const template = await prisma.questionTemplate.create({
      data: {
        prompt: input.prompt.trim(),
        category: input.category,
        difficulty: input.difficulty,
        targetRole: input.targetRole.trim(),
        rubric: input.rubric ?? null,
        estimatedTime: input.estimatedTime ?? 180, // Default 3 minutes
      },
    });

    return template;
  } catch (error) {
    console.error("Failed to create question template:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to create question template");
  }
}

/**
 * Get all available roles
 */
export async function getAvailableRoles() {
  try {
    const roles = await prisma.questionTemplate.findMany({
      distinct: ["targetRole"],
      select: {
        targetRole: true,
      },
      orderBy: {
        targetRole: "asc",
      },
    });

    return roles.map((r) => r.targetRole);
  } catch (error) {
    console.error("Failed to get available roles:", error);
    return [];
  }
}

/**
 * Get all available categories
 */
export async function getAvailableCategories() {
  try {
    const categories = await prisma.questionTemplate.findMany({
      distinct: ["category"],
      select: {
        category: true,
      },
      orderBy: {
        category: "asc",
      },
    });

    return categories.map((c) => c.category);
  } catch (error) {
    console.error("Failed to get available categories:", error);
    return [];
  }
}

/**
 * Seed default question templates
 * Creates templates for 10+ common roles
 */
export async function seedDefaultQuestions() {
  try {
    // Check if questions already exist
    const existingCount = await prisma.questionTemplate.count();
    if (existingCount > 0) {
      console.log(`Question templates already exist (${existingCount} found)`);
      return existingCount;
    }

    const defaultQuestions: CreateQuestionTemplateInput[] = [
      // Software Engineer - Behavioral
      {
        prompt:
          "Tell me about a time when you had to debug a complex issue. What was your approach?",
        category: "behavioral",
        difficulty: "medium",
        targetRole: "Software Engineer",
        estimatedTime: 180,
      },
      {
        prompt:
          "Describe a situation where you had to work with a difficult team member. How did you handle it?",
        category: "behavioral",
        difficulty: "medium",
        targetRole: "Software Engineer",
        estimatedTime: 180,
      },
      {
        prompt:
          "Tell me about a project where you had to learn a new technology quickly.",
        category: "behavioral",
        difficulty: "easy",
        targetRole: "Software Engineer",
        estimatedTime: 180,
      },

      // Software Engineer - Technical
      {
        prompt:
          "Design a system to handle 1 million concurrent users. What are the key considerations?",
        category: "technical",
        difficulty: "hard",
        targetRole: "Software Engineer",
        estimatedTime: 300,
      },
      {
        prompt:
          "Explain the difference between SQL and NoSQL databases. When would you use each?",
        category: "technical",
        difficulty: "medium",
        targetRole: "Software Engineer",
        estimatedTime: 180,
      },
      {
        prompt: "What is the time complexity of binary search and why?",
        category: "technical",
        difficulty: "easy",
        targetRole: "Software Engineer",
        estimatedTime: 120,
      },

      // Product Manager - Behavioral
      {
        prompt:
          "Tell me about a product decision you made that didn't go as planned. What did you learn?",
        category: "behavioral",
        difficulty: "medium",
        targetRole: "Product Manager",
        estimatedTime: 180,
      },
      {
        prompt:
          "Describe a time when you had to prioritize between conflicting stakeholder requests.",
        category: "behavioral",
        difficulty: "medium",
        targetRole: "Product Manager",
        estimatedTime: 180,
      },
      {
        prompt:
          "Tell me about your experience working with engineering teams on technical constraints.",
        category: "behavioral",
        difficulty: "easy",
        targetRole: "Product Manager",
        estimatedTime: 180,
      },

      // Product Manager - Case Study
      {
        prompt:
          "How would you improve the user experience of a mobile banking app?",
        category: "situational",
        difficulty: "medium",
        targetRole: "Product Manager",
        estimatedTime: 300,
      },
      {
        prompt:
          "You notice a 20% drop in user engagement. How would you investigate and address this?",
        category: "situational",
        difficulty: "hard",
        targetRole: "Product Manager",
        estimatedTime: 300,
      },

      // Data Scientist - Technical
      {
        prompt:
          "Explain the difference between supervised and unsupervised learning with examples.",
        category: "technical",
        difficulty: "easy",
        targetRole: "Data Scientist",
        estimatedTime: 180,
      },
      {
        prompt:
          "How would you handle missing data in a dataset? What are the trade-offs?",
        category: "technical",
        difficulty: "medium",
        targetRole: "Data Scientist",
        estimatedTime: 180,
      },
      {
        prompt:
          "Design a machine learning model to predict customer churn. What features would you use?",
        category: "technical",
        difficulty: "hard",
        targetRole: "Data Scientist",
        estimatedTime: 300,
      },

      // Data Scientist - Behavioral
      {
        prompt:
          "Tell me about a time when your analysis led to a significant business decision.",
        category: "behavioral",
        difficulty: "medium",
        targetRole: "Data Scientist",
        estimatedTime: 180,
      },
      {
        prompt:
          "Describe a situation where you had to communicate complex statistical concepts to non-technical stakeholders.",
        category: "behavioral",
        difficulty: "medium",
        targetRole: "Data Scientist",
        estimatedTime: 180,
      },

      // UX Designer - Behavioral
      {
        prompt:
          "Tell me about a design decision you made that was challenged by stakeholders. How did you defend it?",
        category: "behavioral",
        difficulty: "medium",
        targetRole: "UX Designer",
        estimatedTime: 180,
      },
      {
        prompt:
          "Describe a time when user research contradicted your initial design assumptions.",
        category: "behavioral",
        difficulty: "medium",
        targetRole: "UX Designer",
        estimatedTime: 180,
      },

      // UX Designer - Design Thinking
      {
        prompt:
          "How would you redesign the checkout process for an e-commerce website to reduce cart abandonment?",
        category: "situational",
        difficulty: "medium",
        targetRole: "UX Designer",
        estimatedTime: 300,
      },
      {
        prompt:
          "Design an app interface for elderly users to manage their medications. What considerations would you make?",
        category: "situational",
        difficulty: "hard",
        targetRole: "UX Designer",
        estimatedTime: 300,
      },

      // Sales - Behavioral
      {
        prompt:
          "Tell me about your biggest sale and what made it successful.",
        category: "behavioral",
        difficulty: "medium",
        targetRole: "Sales",
        estimatedTime: 180,
      },
      {
        prompt:
          "Describe a time when you had to overcome a major objection from a prospect.",
        category: "behavioral",
        difficulty: "medium",
        targetRole: "Sales",
        estimatedTime: 180,
      },

      // Sales - Situational
      {
        prompt:
          "A prospect says your product is too expensive compared to competitors. How do you respond?",
        category: "situational",
        difficulty: "medium",
        targetRole: "Sales",
        estimatedTime: 180,
      },
      {
        prompt:
          "You're in a sales call and the decision maker suddenly becomes hostile. How do you handle it?",
        category: "situational",
        difficulty: "hard",
        targetRole: "Sales",
        estimatedTime: 180,
      },

      // Marketing - Behavioral
      {
        prompt:
          "Tell me about a marketing campaign you led that exceeded expectations.",
        category: "behavioral",
        difficulty: "medium",
        targetRole: "Marketing",
        estimatedTime: 180,
      },
      {
        prompt:
          "Describe a time when a marketing initiative didn't work as planned. What did you learn?",
        category: "behavioral",
        difficulty: "medium",
        targetRole: "Marketing",
        estimatedTime: 180,
      },

      // Marketing - Case Study
      {
        prompt:
          "How would you create a go-to-market strategy for a new SaaS product?",
        category: "situational",
        difficulty: "hard",
        targetRole: "Marketing",
        estimatedTime: 300,
      },
      {
        prompt:
          "Your company's brand awareness is low. What metrics would you track and how would you improve it?",
        category: "situational",
        difficulty: "hard",
        targetRole: "Marketing",
        estimatedTime: 300,
      },

      // Finance - Technical
      {
        prompt:
          "Explain the difference between cash flow and profit. Why is this distinction important?",
        category: "technical",
        difficulty: "easy",
        targetRole: "Finance",
        estimatedTime: 180,
      },
      {
        prompt:
          "How would you analyze a company's financial health? What key metrics would you look at?",
        category: "technical",
        difficulty: "medium",
        targetRole: "Finance",
        estimatedTime: 180,
      },

      // Finance - Case Study
      {
        prompt:
          "A company is considering acquiring another company. What financial analysis would you perform?",
        category: "situational",
        difficulty: "hard",
        targetRole: "Finance",
        estimatedTime: 300,
      },

      // Operations - Behavioral
      {
        prompt:
          "Tell me about a time when you had to optimize a process. What was the impact?",
        category: "behavioral",
        difficulty: "medium",
        targetRole: "Operations",
        estimatedTime: 180,
      },
      {
        prompt:
          "Describe a situation where you had to manage a crisis or unexpected disruption.",
        category: "behavioral",
        difficulty: "medium",
        targetRole: "Operations",
        estimatedTime: 180,
      },

      // Operations - Situational
      {
        prompt:
          "Your supply chain is disrupted. How would you minimize impact on customers?",
        category: "situational",
        difficulty: "hard",
        targetRole: "Operations",
        estimatedTime: 300,
      },

      // HR - Behavioral
      {
        prompt:
          "Tell me about a time when you had to handle a difficult employee situation.",
        category: "behavioral",
        difficulty: "medium",
        targetRole: "HR",
        estimatedTime: 180,
      },
      {
        prompt:
          "Describe your experience with conflict resolution between team members.",
        category: "behavioral",
        difficulty: "medium",
        targetRole: "HR",
        estimatedTime: 180,
      },

      // Customer Success - Behavioral
      {
        prompt:
          "Tell me about a time when you turned around a dissatisfied customer.",
        category: "behavioral",
        difficulty: "medium",
        targetRole: "Customer Success",
        estimatedTime: 180,
      },
      {
        prompt:
          "Describe a situation where you had to manage customer expectations.",
        category: "behavioral",
        difficulty: "medium",
        targetRole: "Customer Success",
        estimatedTime: 180,
      },
    ];

    // Create all templates
    const created = await prisma.questionTemplate.createMany({
      data: defaultQuestions,
      skipDuplicates: true,
    });

    console.log(`Created ${created.count} question templates`);
    return created.count;
  } catch (error) {
    console.error("Failed to seed default questions:", error);
    throw error;
  }
}

/**
 * Delete a question template
 */
export async function deleteQuestionTemplate(templateId: string) {
  try {
    await prisma.questionTemplate.delete({
      where: { id: templateId },
    });
  } catch (error) {
    console.error("Failed to delete question template:", error);
    throw new Error("Failed to delete question template");
  }
}

/**
 * Update a question template
 */
export async function updateQuestionTemplate(
  templateId: string,
  input: Partial<CreateQuestionTemplateInput>,
) {
  try {
    const template = await prisma.questionTemplate.update({
      where: { id: templateId },
      data: {
        prompt: input.prompt,
        category: input.category,
        difficulty: input.difficulty,
        targetRole: input.targetRole,
        rubric: input.rubric,
        estimatedTime: input.estimatedTime,
      },
    });

    return template;
  } catch (error) {
    console.error("Failed to update question template:", error);
    throw new Error("Failed to update question template");
  }
}
