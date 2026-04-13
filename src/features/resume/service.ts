import { Prisma } from "@prisma/client";
import type { ResumeVisibility } from "@prisma/client";
import { customAlphabet } from "nanoid";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { isVideoUrlValid, toEmbedUrl } from "@/lib/video";
import { VersioningService } from "./versioning-service";

const SHARE_SLUG_ALPHABET = "abcdefghijkmnopqrstuvwxyz0123456789";
const SHARE_SLUG_LENGTH = 10;
const buildShareSlug = customAlphabet(SHARE_SLUG_ALPHABET, SHARE_SLUG_LENGTH);

async function ensureUniqueShareSlug(seed?: string) {
  let candidate = seed?.trim().toLowerCase() || buildShareSlug();

  while (await prisma.resume.findUnique({ where: { shareSlug: candidate } })) {
    candidate = buildShareSlug();
  }

  return candidate;
}

function normalizeIntroVideo(url?: string | null) {
  const trimmed = url?.trim();
  if (!trimmed) {
    return { introVideoUrl: null, introVideoEmbedUrl: null };
  }

  if (!isVideoUrlValid(trimmed)) {
    throw new Error(
      "Intro video link must be hosted on YouTube, Vimeo, Google Drive, or Cloudinary."
    );
  }

  return {
    introVideoUrl: trimmed,
    introVideoEmbedUrl: toEmbedUrl(trimmed),
  };
}

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
  introVideoUrl?: string | null;
  headshotUrl?: string | null;
  shareSlug?: string;
  template?: string;
}

export async function updateResumeSkillSnapshot(
  resumeId: string,
  snapshot: Prisma.InputJsonValue | null
) {
  return prisma.resume.update({
    where: { id: resumeId },
    data: {
      skillAnalysisSnapshot: snapshot ?? Prisma.JsonNull,
      updatedAt: new Date(),
    },
    select: { id: true, headshotUrl: true },
  });
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

export interface CreateEducationInput {
  resumeId: string;
  school: string;
  degree?: string | null;
  field?: string | null;
  summary?: string | null;
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

  if (data.introVideoUrl !== undefined) {
    const normalized = normalizeIntroVideo(data.introVideoUrl);
    updateData.introVideoUrl = normalized.introVideoUrl;
    updateData.introVideoEmbedUrl = normalized.introVideoEmbedUrl;
  }

  if (data.headshotUrl !== undefined) {
    updateData.headshotUrl = data.headshotUrl;
  }

  if (data.template !== undefined) {
    updateData.template = data.template as any;
  }

  return updateData;
}

export async function createResume(input: CreateResumeInput) {
  const slug = await ensureUniqueResumeSlug(input.title);
  const shareSlug = await ensureUniqueShareSlug(input.shareSlug);
  const introVideo = normalizeIntroVideo(input.introVideoUrl);

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
      shareSlug,
      introVideoUrl: introVideo.introVideoUrl,
      introVideoEmbedUrl: introVideo.introVideoEmbedUrl,
      headshotUrl: input.headshotUrl ?? null,
    },
    include: {
      experiences: {
        orderBy: { order: "asc" },
      },
      projects: {
        orderBy: { order: "asc" },
      },
      education: {
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function updateResume(slug: string, data: UpdateResumeInput) {
  if (Object.keys(data).length === 0) {
    return getResumeBySlug(slug);
  }

  // Get current resume to create version snapshot
  const currentResume = await getResumeBySlug(slug);
  if (!currentResume) {
    throw new Error(`Resume not found: ${slug}`);
  }

  // Create version snapshot before updating (async, non-blocking)
  VersioningService.createVersion(
    currentResume.id,
    `Updated resume: ${Object.keys(data).join(', ')}`
  ).catch(err => {
    console.error('Failed to create version snapshot:', err);
  });

  const updateData = buildResumeUpdateInput(data);

  if (data.shareSlug !== undefined) {
    updateData.shareSlug = data.shareSlug
      ? await ensureUniqueShareSlug(data.shareSlug)
      : null;
  }

  return prisma.resume.update({
    where: { slug },
    data: updateData,
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
  data: {
    company?: string;
    role?: string;
    startDate?: Date;
    endDate?: Date | null;
    achievements?: string[];
    description?: string | null;
  }
) {
  const payload: Prisma.ResumeExperienceUpdateInput = {};

  if (data.company !== undefined) {
    payload.company = data.company;
  }
  if (data.role !== undefined) {
    payload.role = data.role;
  }
  if (data.startDate !== undefined) {
    payload.startDate = data.startDate;
  }
  if (data.endDate !== undefined) {
    payload.endDate = data.endDate;
  }
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

export async function createResumeEducation(input: CreateEducationInput) {
  const order = await prisma.resumeEducation.count({ where: { resumeId: input.resumeId } });

  return prisma.resumeEducation.create({
    data: {
      resumeId: input.resumeId,
      school: input.school,
      degree: input.degree ?? null,
      field: input.field ?? null,
      summary: input.summary ?? null,
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
      education: {
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function getResumeByShareSlug(shareSlug: string) {
  return prisma.resume.findUnique({
    where: { shareSlug },
    select: {
      id: true,
      title: true,
      summary: true,
      skills: true,
      personaName: true,
      location: true,
      visibility: true,
      introVideoEmbedUrl: true,
      headshotUrl: true,
      template: true,
      experiences: {
        select: {
          id: true,
          company: true,
          role: true,
          startDate: true,
          endDate: true,
          description: true,
          achievements: true,
        },
        orderBy: { order: "asc" },
      },
      projects: {
        select: {
          id: true,
          name: true,
          summary: true,
          link: true,
          techStack: true,
        },
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function incrementResumeViewCount(resumeId: string) {
  try {
    await prisma.resume.update({
      where: { id: resumeId },
      data: { viewCount: { increment: 1 } },
      select: { id: true },
    });
  } catch (error) {
    console.error("Failed to increment resume view count", error);
  }
}

export async function regenerateResumeShareSlug(slug: string) {
  const nextShareSlug = await ensureUniqueShareSlug();

  return prisma.resume.update({
    where: { slug },
    data: { shareSlug: nextShareSlug },
    select: { shareSlug: true },
  });
}

export async function listUserResumes(userId: string) {
  try {
    return await prisma.resume.findMany({
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
  } catch (error: any) {
    // If the production database is missing the `template` column (Prisma P2022),
    // fall back to selecting explicit columns excluding `template` so the
    // query doesn't reference a missing column. This avoids crashing the
    // Server Component render in production while the migration is applied.
    if (error?.code === "P2022") {
      console.warn("Fallback resume query due to missing column (P2022)", error?.meta ?? "");
      return prisma.resume.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        // Return a restricted set of top-level fields to avoid referencing
        // any missing columns (e.g. `template`) in older production DBs.
        select: {
          id: true,
          userId: true,
          title: true,
          summary: true,
          slug: true,
          shareSlug: true,
          visibility: true,
          createdAt: true,
          updatedAt: true,
          location: true,
          notableAchievements: true,
          personaName: true,
          targetIndustry: true,
          targetRoles: true,
          topSkills: true,
          yearsExperience: true,
          viewCount: true,
          introVideoUrl: true,
          introVideoEmbedUrl: true,
        },
      });
    }

    throw error;
  }
}

export async function importResume(userId: string, resumeData: any) {
  try {
    const title = resumeData.title || "Imported Resume";
    const slug = await ensureUniqueResumeSlug(title);
    const shareSlug = await ensureUniqueShareSlug();

    const resume = await prisma.resume.create({
      data: {
        userId,
        title,
        slug,
        shareSlug,
        summary: resumeData.summary,
        personaName: resumeData.personaName,
        location: resumeData.location,
        targetIndustry: resumeData.targetIndustry,
        targetRoles: resumeData.targetRoles || [],
        yearsExperience: resumeData.yearsExperience,
        topSkills: resumeData.topSkills || [],
        notableAchievements: resumeData.notableAchievements,
      },
    });

    return resume;
  } catch (error) {
    console.error("Failed to import resume", error);
    throw error;
  }
}
