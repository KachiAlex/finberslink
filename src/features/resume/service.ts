import type { Prisma, ResumeVisibility } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

export interface CreateResumeInput {
  userId: string;
  title: string;
  summary?: string;
  personaName?: string;
  location?: string;
  targetIndustry?: string;
  targetRoles?: string[];
  yearsExperience?: number;
  topSkills?: string[];
  skills?: string[];
  notableAchievements?: string;
  visibility?: ResumeVisibility;
}

export interface UpdateResumeInput extends Partial<Omit<CreateResumeInput, "userId">> {
  userId?: string;
}

export interface CreateExperienceInput {
  resumeId: string;
  company: string;
  role: string;
  startDate: Date;
  endDate?: Date | null;
  description?: string | null;
  achievements?: string[];
}

export interface CreateProjectInput {
  resumeId: string;
  name: string;
  summary?: string | null;
  link?: string | null;
  techStack?: string[];
}

async function ensureUniqueResumeSlug(title: string) {
  const base = slugify(title, "resume");
  let candidate = base;
  let counter = 1;

  while (await prisma.resume.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }

  return candidate;
}

function buildResumeUpdateInput(data: UpdateResumeInput): Prisma.ResumeUpdateInput {
  const updateData: Prisma.ResumeUpdateInput = {};

  if (data.title !== undefined) {
    updateData.title = data.title;
  }
  if (data.summary !== undefined) {
    updateData.summary = data.summary;
  }
  if (data.personaName !== undefined) {
    updateData.personaName = data.personaName;
  }
  if (data.location !== undefined) {
    updateData.location = data.location;
  }
  if (data.targetIndustry !== undefined) {
    updateData.targetIndustry = data.targetIndustry;
  }
  if (data.targetRoles !== undefined) {
    updateData.targetRoles = data.targetRoles;
  }
  if (data.yearsExperience !== undefined) {
    updateData.yearsExperience = data.yearsExperience;
  }
  if (data.topSkills !== undefined) {
    updateData.topSkills = data.topSkills;
  }
  if (data.skills !== undefined) {
    updateData.skills = data.skills;
  }
  if (data.notableAchievements !== undefined) {
    updateData.notableAchievements = data.notableAchievements;
  }
  if (data.visibility !== undefined) {
    updateData.visibility = data.visibility;
  }

  return updateData;
}

export async function createResume(input: CreateResumeInput) {
  const slug = await ensureUniqueResumeSlug(input.title);

  return prisma.resume.create({
    data: {
      userId: input.userId,
      title: input.title,
      summary: input.summary ?? null,
      personaName: input.personaName ?? null,
      location: input.location ?? null,
      targetIndustry: input.targetIndustry ?? null,
      targetRoles: input.targetRoles ?? [],
      yearsExperience: input.yearsExperience ?? null,
      topSkills: input.topSkills ?? [],
      notableAchievements: input.notableAchievements ?? null,
      skills: input.skills ?? input.topSkills ?? [],
      visibility: input.visibility ?? undefined,
      slug,
    },
    include: {
      experiences: {
        orderBy: { order: "asc" },
      },
      projects: {
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function updateResume(slug: string, data: UpdateResumeInput) {
  if (Object.keys(data).length === 0) {
    return getResumeBySlug(slug);
  }

  return prisma.resume.update({
    where: { slug },
    data: buildResumeUpdateInput(data),
    include: {
      experiences: {
        orderBy: { order: "asc" },
      },
      projects: {
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function updateResumeExperience(
  experienceId: string,
  data: { achievements?: string[]; description?: string }
) {
  const payload: Prisma.ResumeExperienceUpdateInput = {};

  if (data.achievements !== undefined) {
    payload.achievements = data.achievements;
  }
  if (data.description !== undefined) {
    payload.description = data.description;
  }

  return prisma.resumeExperience.update({
    where: { id: experienceId },
    data: payload,
  });
}

export async function createResumeExperience(input: CreateExperienceInput) {
  const order = await prisma.resumeExperience.count({ where: { resumeId: input.resumeId } });

  return prisma.resumeExperience.create({
    data: {
      resumeId: input.resumeId,
      company: input.company,
      role: input.role,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      description: input.description ?? null,
      achievements: input.achievements ?? [],
      order,
    },
  });
}

export async function createResumeProject(input: CreateProjectInput) {
  const order = await prisma.resumeProject.count({ where: { resumeId: input.resumeId } });

  return prisma.resumeProject.create({
    data: {
      resumeId: input.resumeId,
      name: input.name,
      summary: input.summary ?? null,
      link: input.link ?? null,
      techStack: input.techStack ?? [],
      order,
    },
  });
}

export async function getResumeBySlug(slug: string) {
  return prisma.resume.findUnique({
    where: { slug },
    include: {
      experiences: {
        orderBy: { order: "asc" },
      },
      projects: {
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function listUserResumes(userId: string) {
  return prisma.resume.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      experiences: {
        orderBy: { order: "asc" },
      },
      projects: {
        orderBy: { order: "asc" },
      },
    },
  });
}
