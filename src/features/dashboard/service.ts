import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { SkillAnalysisResponse } from "@/lib/ai/resume";

type FocusCard = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  accent: "blue" | "amber" | "emerald" | "violet";
};

type SkillInsights = {
  personaName?: string | null;
  targetRoles: string[];
  targetIndustry?: string | null;
  highlightSkills: string[];
  gapSkills: string[];
  recommendation: string;
};

type DashboardInsightsPayload = {
  focus: FocusCard[];
  skills: SkillInsights | null;
};

const DASHBOARD_INSIGHTS_TTL_MINUTES = 60;

export async function getStudentEnrollments(userId: string, limit?: number) {
  return prisma.enrollment.findMany({
    where: { userId },
    include: {
      course: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function getStudentResumes(userId: string, limit?: number) {
  return prisma.resume.findMany({
    where: { userId },
    include: { experiences: true, projects: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function getStudentApplications(userId: string, options?: { jobsLimit?: number; volunteerLimit?: number }) {
  const jobApplications = await prisma.jobApplication.findMany({
    where: { userId },
    include: { opportunity: true, resume: true },
    orderBy: { submittedAt: 'desc' },
    take: options?.jobsLimit,
  });

  const volunteerApplications = await prisma.volunteerApplication.findMany({
    where: { userId },
    include: { opportunity: true },
    orderBy: { submittedAt: 'desc' },
    take: options?.volunteerLimit,
  });

  return {
    jobs: jobApplications,
    volunteer: volunteerApplications,
  };
}

async function safeCount<T>(label: string, action: () => Promise<T>): Promise<T | 0> {
  try {
    return await action();
  } catch (error) {
    console.error(`[Dashboard] Failed to load ${label} count`, error);
    return 0;
  }
}

export async function getDashboardSummary(userId: string) {
  const [
    enrollmentsCount,
    completedEnrollmentsCount,
    resumesCount,
    jobApplicationsCount,
    volunteerApplicationsCount,
    resumeViewsCount,
  ] = await Promise.all([
    safeCount("enrollments", () => prisma.enrollment.count({ where: { userId } })),
    safeCount("completed enrollments", () => prisma.enrollment.count({ where: { userId, status: "COMPLETED" } })),
    safeCount("resumes", () => prisma.resume.count({ where: { userId } })),
    safeCount("job applications", () => prisma.jobApplication.count({ where: { userId } })),
    safeCount("volunteer applications", () => prisma.volunteerApplication.count({ where: { userId } })),
    safeCount("resume views", async () => {
      const aggregate = await prisma.resume.aggregate({
        where: { userId },
        _sum: { viewCount: true },
      });
      return aggregate._sum.viewCount ?? 0;
    }),
  ]);

  return {
    enrollmentsCount,
    completedEnrollmentsCount,
    resumesCount,
    applicationsCount: jobApplicationsCount + volunteerApplicationsCount,
    jobApplicationsCount,
    volunteerApplicationsCount,
    resumeViewsCount,
  };
}

export async function listSavedJobIds(userId: string, limit = 50) {
  const saved = await prisma.jobSave.findMany({
    where: { userId },
    select: { jobOpportunityId: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return saved.map((item) => item.jobOpportunityId);
}

export async function listRecommendedJobs(limit = 5) {
  return prisma.jobOpportunity.findMany({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      company: true,
      location: true,
      remoteOption: true,
      slug: true,
    },
  });
}

const ROLE_SKILL_GUIDE: Record<string, string[]> = {
  product: ["Product Strategy", "Roadmapping", "Experimentation", "Stakeholder Management"],
  design: ["Design Systems", "Prototyping", "User Research", "Figma"],
  engineering: ["System Design", "TypeScript", "APIs", "Testing"],
  data: ["SQL", "Storytelling", "Dashboards", "Modeling"],
  marketing: ["Lifecycle", "Analytics", "Copywriting", "Paid Media"],
  operations: ["Process Design", "Automation", "Cross-functional Collaboration"],
};

function normalize(items?: string[] | null) {
  return (items ?? [])
    .map((item) => item?.trim())
    .filter((item): item is string => Boolean(item));
}

function isSkillAnalysisSnapshot(value: Prisma.JsonValue | null | undefined): SkillAnalysisResponse | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const snapshot = value as Record<string, unknown>;
  const requiredKeys: Array<keyof SkillAnalysisResponse> = [
    "hardSkills",
    "softSkills",
    "suggestedSkills",
    "prioritySkills",
  ];

  const hasArrays = requiredKeys.every((key) => Array.isArray(snapshot[key]));
  if (!hasArrays) {
    return null;
  }

  return snapshot as SkillAnalysisResponse;
}

function buildSkillInsights(resume?: {
  personaName?: string | null;
  targetIndustry?: string | null;
  targetRoles?: string[] | null;
  topSkills?: string[] | null;
  skills?: string[] | null;
  skillAnalysisSnapshot?: Prisma.JsonValue | null;
}): SkillInsights | null {
  if (!resume) {
    return null;
  }

  const targetRoles = normalize(resume.targetRoles);

  const snapshot = isSkillAnalysisSnapshot(resume.skillAnalysisSnapshot);
  if (snapshot) {
    const highlightSkills = snapshot.prioritySkills.length
      ? snapshot.prioritySkills.slice(0, 4)
      : snapshot.hardSkills.slice(0, 4);
    const gapSkills = snapshot.suggestedSkills.slice(0, 4);
    const recommendation = gapSkills.length
      ? `Strengthen evidence for ${gapSkills.join(", ")} to boost alignment with ${
          targetRoles[0] ?? "your target role"
        }.`
      : "AI analysis shows strong coverage. Keep shipping tailored applications.";

    return {
      personaName: resume.personaName,
      targetIndustry: resume.targetIndustry,
      targetRoles,
      highlightSkills,
      gapSkills,
      recommendation,
    };
  }

  const candidateSkills = normalize(resume.topSkills).concat(normalize(resume.skills));
  const normalizedSet = new Set(candidateSkills.map((skill) => skill.toLowerCase()));

  const expectedSkills = new Set<string>();
  targetRoles
    .map((role) => role.toLowerCase())
    .forEach((role) => {
      Object.entries(ROLE_SKILL_GUIDE).forEach(([key, skills]) => {
        if (role.includes(key)) {
          skills.forEach((skill) => expectedSkills.add(skill));
        }
      });
    });

  const gapSkills = Array.from(expectedSkills)
    .filter((skill) => !normalizedSet.has(skill.toLowerCase()))
    .slice(0, 4);

  const highlightSkills = candidateSkills.slice(0, 4);

  const recommendation = gapSkills.length
    ? `Add evidence of ${gapSkills.join(", ")} to your resume or projects to de-risk ${targetRoles[0] ?? "your target role"}.`
    : "Your skill story looks balanced. Keep applying momentum to stay interview-ready.";

  return {
    personaName: resume.personaName,
    targetIndustry: resume.targetIndustry,
    targetRoles,
    highlightSkills,
    gapSkills,
    recommendation,
  };
}

function buildFocusCards(args: {
  summary: Awaited<ReturnType<typeof getDashboardSummary>>;
  resume?: { id: string | null } | null;
  pendingInterviews: number;
  enrollmentsNeedingAttention: number;
}): FocusCard[] {
  const cards: FocusCard[] = [];

  if (!args.resume) {
    cards.push({
      id: "resume",
      title: "Ship your signature resume",
      description: "AI will assemble your narrative in under 5 minutes—unlock better role matches.",
      actionLabel: "Launch builder",
      actionHref: "/resume/builder",
      accent: "violet",
    });
  }

  if (args.summary.enrollmentsCount === 0) {
    cards.push({
      id: "courses",
      title: "Kick off a track",
      description: "Enroll in a live cohort to start unlocking personalized job picks.",
      actionLabel: "Browse courses",
      actionHref: "/courses",
      accent: "blue",
    });
  } else if (args.enrollmentsNeedingAttention > 0) {
    cards.push({
      id: "progress",
      title: "Progress slipping",
      description: `${args.enrollmentsNeedingAttention} active track${
        args.enrollmentsNeedingAttention > 1 ? "s" : ""
      } are below 40% mastery. Reclaim the pace.`,
      actionLabel: "Resume lessons",
      actionHref: "/courses",
      accent: "amber",
    });
  }

  if (args.summary.applicationsCount === 0 && args.resume) {
    cards.push({
      id: "applications",
      title: "Submit a flagship application",
      description: "Pair your resume with a curated Finbers role for faster recruiter callbacks.",
      actionLabel: "Find roles",
      actionHref: "/jobs",
      accent: "emerald",
    });
  } else if (args.pendingInterviews > 0) {
    cards.push({
      id: "interviews",
      title: "Prep for upcoming interviews",
      description: `${args.pendingInterviews} pipeline opportunity${
        args.pendingInterviews > 1 ? "ies" : "y"
      } are in interview. Warm up stories now.`,
      actionLabel: "View pipeline",
      actionHref: "/applications",
      accent: "emerald",
    });
  }

  return cards.slice(0, 3);
}

function deserializeInsights(entry: { focus: Prisma.JsonValue; skills: Prisma.JsonValue | null }): DashboardInsightsPayload {
  const focus = Array.isArray(entry.focus) ? (entry.focus as FocusCard[]) : [];
  const skills = entry.skills ? (entry.skills as SkillInsights) : null;
  return { focus, skills };
}

function shouldUseCache(refreshedAt: Date) {
  const ageMinutes = (Date.now() - refreshedAt.getTime()) / 1000 / 60;
  return ageMinutes < DASHBOARD_INSIGHTS_TTL_MINUTES;
}

export async function getDashboardInsights(userId: string) {
  const cached = await prisma.dashboardInsight.findUnique({ where: { userId } });
  if (cached && shouldUseCache(cached.refreshedAt)) {
    return deserializeInsights(cached);
  }

  const [resume, summary, latestApplications, enrollments] = await Promise.all([
    prisma.resume.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        personaName: true,
        targetIndustry: true,
        targetRoles: true,
        topSkills: true,
        skills: true,
        skillAnalysisSnapshot: true,
      },
    }),
    getDashboardSummary(userId),
    prisma.jobApplication.findMany({
      where: { userId },
      orderBy: { submittedAt: "desc" },
      take: 4,
      select: { status: true },
    }),
    prisma.enrollment.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: { progressPercentage: true },
    }),
  ]);

  const pendingInterviews = latestApplications.filter((app) => app.status === "INTERVIEW").length;
  const enrollmentsNeedingAttention = enrollments.filter((course) => (course.progressPercentage ?? 0) < 40).length;

  const payload: DashboardInsightsPayload = {
    focus: buildFocusCards({
      summary,
      resume,
      pendingInterviews,
      enrollmentsNeedingAttention,
    }),
    skills: buildSkillInsights(resume ?? undefined),
  };

  // Use a safer update-or-create pattern that doesn't rely on unique constraints
  try {
    const existing = await prisma.dashboardInsight.findFirst({
      where: { userId },
    });

    if (existing) {
      await prisma.dashboardInsight.update({
        where: { id: existing.id },
        data: {
          focus: payload.focus as unknown as Prisma.InputJsonValue,
          skills: payload.skills ? (payload.skills as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
          refreshedAt: new Date(),
        },
      });
    } else {
      await prisma.dashboardInsight.create({
        data: {
          userId,
          focus: payload.focus as unknown as Prisma.InputJsonValue,
          skills: payload.skills ? (payload.skills as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        },
      });
    }
  } catch (error) {
    // Silently fail on insights - it's not critical
    console.error("Failed to update dashboard insights:", error);
  }

  return payload;
}

export async function invalidateDashboardInsights(userId: string) {
  try {
    await prisma.dashboardInsight.delete({ where: { userId } });
  } catch (error) {
    // Ignore missing cache entries
  }
}
