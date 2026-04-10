import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_QUESTIONS = [
  // Software Engineer
  {
    text: 'Tell me about a time when you had to debug a complex issue. What was your approach?',
    targetRole: 'Software Engineer',
    category: 'Behavioral',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Look for systematic debugging approach, problem-solving skills, and communication of findings.',
  },
  {
    text: 'Design a system to handle millions of concurrent users. What are the key considerations?',
    targetRole: 'Software Engineer',
    category: 'Technical',
    difficulty: 'hard' as const,
    estimatedTime: 300,
    rubric: 'Evaluate understanding of scalability, load balancing, caching, databases, and trade-offs.',
  },
  {
    text: 'How do you approach code reviews? What do you look for?',
    targetRole: 'Software Engineer',
    category: 'Behavioral',
    difficulty: 'easy' as const,
    estimatedTime: 120,
    rubric: 'Look for code quality focus, collaboration, and constructive feedback approach.',
  },
  {
    text: 'Explain the difference between SQL and NoSQL databases. When would you use each?',
    targetRole: 'Software Engineer',
    category: 'Technical',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Assess understanding of data models, consistency, scalability, and use case matching.',
  },
  {
    text: 'Describe a project where you had to learn a new technology quickly. How did you approach it?',
    targetRole: 'Software Engineer',
    category: 'Behavioral',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Evaluate learning ability, resourcefulness, and adaptability.',
  },
  {
    text: 'What is your experience with microservices architecture? What are the benefits and challenges?',
    targetRole: 'Software Engineer',
    category: 'Technical',
    difficulty: 'hard' as const,
    estimatedTime: 240,
    rubric: 'Look for understanding of distributed systems, service communication, and operational complexity.',
  },
  {
    text: 'Tell me about a time when you disagreed with a team member. How did you handle it?',
    targetRole: 'Software Engineer',
    category: 'Behavioral',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Assess conflict resolution, communication, and ability to work with diverse perspectives.',
  },

  // Product Manager
  {
    text: 'How would you approach defining success metrics for a new feature?',
    targetRole: 'Product Manager',
    category: 'Behavioral',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Look for data-driven thinking, business acumen, and user-centric approach.',
  },
  {
    text: 'Walk me through your process for prioritizing features in a product roadmap.',
    targetRole: 'Product Manager',
    category: 'Behavioral',
    difficulty: 'medium' as const,
    estimatedTime: 240,
    rubric: 'Evaluate prioritization frameworks, stakeholder management, and strategic thinking.',
  },
  {
    text: 'How would you handle a situation where engineering says a feature will take 3x longer than estimated?',
    targetRole: 'Product Manager',
    category: 'Behavioral',
    difficulty: 'hard' as const,
    estimatedTime: 180,
    rubric: 'Assess problem-solving, stakeholder communication, and trade-off analysis.',
  },
  {
    text: 'Describe a product you love and explain why. What would you improve?',
    targetRole: 'Product Manager',
    category: 'Behavioral',
    difficulty: 'easy' as const,
    estimatedTime: 180,
    rubric: 'Look for product thinking, user empathy, and critical analysis.',
  },
  {
    text: 'How do you gather and validate customer feedback?',
    targetRole: 'Product Manager',
    category: 'Behavioral',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Evaluate customer research methods, validation techniques, and user understanding.',
  },
  {
    text: 'Tell me about a time when you had to pivot your product strategy. What led to that decision?',
    targetRole: 'Product Manager',
    category: 'Behavioral',
    difficulty: 'hard' as const,
    estimatedTime: 240,
    rubric: 'Assess adaptability, data-driven decision making, and leadership.',
  },

  // Data Scientist
  {
    text: 'Walk me through your approach to building a machine learning model from scratch.',
    targetRole: 'Data Scientist',
    category: 'Technical',
    difficulty: 'hard' as const,
    estimatedTime: 300,
    rubric: 'Evaluate understanding of ML pipeline, feature engineering, model selection, and evaluation.',
  },
  {
    text: 'How do you handle missing data in a dataset?',
    targetRole: 'Data Scientist',
    category: 'Technical',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Look for understanding of imputation techniques, bias considerations, and trade-offs.',
  },
  {
    text: 'Explain the difference between supervised and unsupervised learning with examples.',
    targetRole: 'Data Scientist',
    category: 'Technical',
    difficulty: 'easy' as const,
    estimatedTime: 120,
    rubric: 'Assess fundamental ML knowledge and ability to explain concepts clearly.',
  },
  {
    text: 'Tell me about a time when your model performed well in testing but poorly in production. What happened?',
    targetRole: 'Data Scientist',
    category: 'Behavioral',
    difficulty: 'hard' as const,
    estimatedTime: 240,
    rubric: 'Evaluate debugging skills, understanding of data drift, and problem-solving.',
  },
  {
    text: 'How do you approach feature selection? What methods do you use?',
    targetRole: 'Data Scientist',
    category: 'Technical',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Look for understanding of feature importance, dimensionality reduction, and domain knowledge.',
  },
  {
    text: 'Describe your experience with big data tools and distributed computing.',
    targetRole: 'Data Scientist',
    category: 'Technical',
    difficulty: 'hard' as const,
    estimatedTime: 240,
    rubric: 'Assess familiarity with Spark, Hadoop, cloud platforms, and scalability considerations.',
  },

  // UX Designer
  {
    text: 'Walk me through your design process from problem to solution.',
    targetRole: 'UX Designer',
    category: 'Behavioral',
    difficulty: 'medium' as const,
    estimatedTime: 240,
    rubric: 'Evaluate design thinking, user research, iteration, and problem-solving approach.',
  },
  {
    text: 'Tell me about a design decision you made that was controversial. How did you justify it?',
    targetRole: 'UX Designer',
    category: 'Behavioral',
    difficulty: 'hard' as const,
    estimatedTime: 180,
    rubric: 'Assess communication skills, data-driven thinking, and ability to handle feedback.',
  },
  {
    text: 'How do you approach designing for accessibility?',
    targetRole: 'UX Designer',
    category: 'Behavioral',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Look for understanding of inclusive design, WCAG standards, and empathy.',
  },
  {
    text: 'Describe your experience with user research methods.',
    targetRole: 'UX Designer',
    category: 'Behavioral',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Evaluate knowledge of research techniques, user testing, and insights extraction.',
  },
  {
    text: 'How do you measure the success of a design?',
    targetRole: 'UX Designer',
    category: 'Behavioral',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Assess understanding of metrics, analytics, and data-driven design.',
  },

  // Sales
  {
    text: 'Tell me about your most successful sale. What was your strategy?',
    targetRole: 'Sales',
    category: 'Behavioral',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Look for sales process understanding, relationship building, and closing techniques.',
  },
  {
    text: 'How do you handle objections from prospects?',
    targetRole: 'Sales',
    category: 'Behavioral',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Evaluate listening skills, problem-solving, and ability to address concerns.',
  },
  {
    text: 'Describe your approach to prospecting and lead generation.',
    targetRole: 'Sales',
    category: 'Behavioral',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Assess prospecting methods, persistence, and qualification skills.',
  },
  {
    text: 'Tell me about a time when you lost a deal. What did you learn?',
    targetRole: 'Sales',
    category: 'Behavioral',
    difficulty: 'hard' as const,
    estimatedTime: 180,
    rubric: 'Look for self-reflection, learning ability, and resilience.',
  },
  {
    text: 'How do you build and maintain relationships with clients?',
    targetRole: 'Sales',
    category: 'Behavioral',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Evaluate relationship management, communication, and customer focus.',
  },

  // Marketing
  {
    text: 'How would you develop a go-to-market strategy for a new product?',
    targetRole: 'Marketing',
    category: 'Behavioral',
    difficulty: 'hard' as const,
    estimatedTime: 240,
    rubric: 'Assess strategic thinking, market analysis, and execution planning.',
  },
  {
    text: 'Tell me about a successful marketing campaign you led. What made it successful?',
    targetRole: 'Marketing',
    category: 'Behavioral',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Look for campaign strategy, metrics, and results orientation.',
  },
  {
    text: 'How do you approach measuring marketing ROI?',
    targetRole: 'Marketing',
    category: 'Behavioral',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Evaluate analytics understanding, attribution modeling, and data-driven approach.',
  },
  {
    text: 'Describe your experience with digital marketing channels.',
    targetRole: 'Marketing',
    category: 'Behavioral',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Assess knowledge of SEO, SEM, social media, email, and channel optimization.',
  },
  {
    text: 'How do you stay current with marketing trends and best practices?',
    targetRole: 'Marketing',
    category: 'Behavioral',
    difficulty: 'easy' as const,
    estimatedTime: 120,
    rubric: 'Look for continuous learning, industry awareness, and professional development.',
  },

  // Finance
  {
    text: 'Walk me through how you would analyze a company\'s financial statements.',
    targetRole: 'Finance',
    category: 'Technical',
    difficulty: 'hard' as const,
    estimatedTime: 240,
    rubric: 'Evaluate understanding of financial analysis, ratios, and interpretation.',
  },
  {
    text: 'Explain the difference between cash flow and profit.',
    targetRole: 'Finance',
    category: 'Technical',
    difficulty: 'medium' as const,
    estimatedTime: 120,
    rubric: 'Assess fundamental finance knowledge and ability to explain clearly.',
  },
  {
    text: 'How would you approach valuing a company?',
    targetRole: 'Finance',
    category: 'Technical',
    difficulty: 'hard' as const,
    estimatedTime: 240,
    rubric: 'Look for understanding of valuation methods, DCF, comparables, and assumptions.',
  },
  {
    text: 'Tell me about a time when you identified a financial risk or opportunity.',
    targetRole: 'Finance',
    category: 'Behavioral',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Evaluate analytical skills, business acumen, and impact.',
  },
  {
    text: 'How do you approach budgeting and forecasting?',
    targetRole: 'Finance',
    category: 'Behavioral',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Assess planning skills, accuracy, and stakeholder management.',
  },

  // Operations
  {
    text: 'How would you approach improving operational efficiency?',
    targetRole: 'Operations',
    category: 'Behavioral',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Look for process improvement thinking, data analysis, and implementation skills.',
  },
  {
    text: 'Tell me about a time when you had to manage a crisis or unexpected issue.',
    targetRole: 'Operations',
    category: 'Behavioral',
    difficulty: 'hard' as const,
    estimatedTime: 180,
    rubric: 'Evaluate crisis management, quick thinking, and problem-solving.',
  },
  {
    text: 'How do you approach supply chain management?',
    targetRole: 'Operations',
    category: 'Behavioral',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Assess understanding of logistics, vendor management, and optimization.',
  },
  {
    text: 'Describe your experience with process documentation and standardization.',
    targetRole: 'Operations',
    category: 'Behavioral',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Look for attention to detail, process thinking, and scalability focus.',
  },
  {
    text: 'How do you measure operational performance?',
    targetRole: 'Operations',
    category: 'Behavioral',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Evaluate metrics selection, KPI understanding, and data-driven approach.',
  },

  // HR
  {
    text: 'How would you approach building a strong company culture?',
    targetRole: 'HR',
    category: 'Behavioral',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Look for understanding of culture, employee engagement, and leadership.',
  },
  {
    text: 'Tell me about a time when you had to handle a difficult employee situation.',
    targetRole: 'HR',
    category: 'Behavioral',
    difficulty: 'hard' as const,
    estimatedTime: 180,
    rubric: 'Assess conflict resolution, fairness, and people management skills.',
  },
  {
    text: 'How do you approach talent acquisition and retention?',
    targetRole: 'HR',
    category: 'Behavioral',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Evaluate recruitment strategy, retention programs, and employee value proposition.',
  },
  {
    text: 'Describe your experience with performance management.',
    targetRole: 'HR',
    category: 'Behavioral',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Look for feedback skills, goal setting, and development focus.',
  },
  {
    text: 'How do you stay current with employment law and HR best practices?',
    targetRole: 'HR',
    category: 'Behavioral',
    difficulty: 'easy' as const,
    estimatedTime: 120,
    rubric: 'Assess compliance knowledge, continuous learning, and professional development.',
  },

  // Customer Success
  {
    text: 'Tell me about a time when you turned around a struggling customer relationship.',
    targetRole: 'Customer Success',
    category: 'Behavioral',
    difficulty: 'hard' as const,
    estimatedTime: 180,
    rubric: 'Evaluate problem-solving, empathy, and relationship management.',
  },
  {
    text: 'How do you approach onboarding new customers?',
    targetRole: 'Customer Success',
    category: 'Behavioral',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Look for customer focus, process thinking, and success orientation.',
  },
  {
    text: 'Describe your approach to identifying and preventing customer churn.',
    targetRole: 'Customer Success',
    category: 'Behavioral',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Assess proactive thinking, data analysis, and retention strategies.',
  },
  {
    text: 'How do you handle difficult customer complaints?',
    targetRole: 'Customer Success',
    category: 'Behavioral',
    difficulty: 'medium' as const,
    estimatedTime: 180,
    rubric: 'Evaluate listening skills, empathy, and problem-solving.',
  },
  {
    text: 'Tell me about a time when you went above and beyond for a customer.',
    targetRole: 'Customer Success',
    category: 'Behavioral',
    difficulty: 'easy' as const,
    estimatedTime: 120,
    rubric: 'Look for customer obsession, initiative, and service mindset.',
  },
];

async function main() {
  console.log('Seeding interview questions...');

  try {
    // Delete existing questions to avoid duplicates
    await prisma.questionTemplate.deleteMany({});
    console.log('Cleared existing questions');

    // Create all questions
    const created = await prisma.questionTemplate.createMany({
      data: DEFAULT_QUESTIONS,
    });

    console.log(`Successfully created ${created.count} question templates`);

    // Log summary by role
    const roles = [...new Set(DEFAULT_QUESTIONS.map((q) => q.targetRole))];
    console.log('\nQuestions by role:');
    for (const role of roles) {
      const count = DEFAULT_QUESTIONS.filter((q) => q.targetRole === role).length;
      console.log(`  ${role}: ${count} questions`);
    }
  } catch (error) {
    console.error('Error seeding questions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
