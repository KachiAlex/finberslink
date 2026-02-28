import { ResumeVisibility } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function createResume(input: { title: string; summary?: string }) {
  // TODO: get userId from session
  const userId = "demo_student";

  const slug = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return prisma.resume.create({
    data: {
      title: input.title,
      summary: input.summary,
      slug,
      visibility: ResumeVisibility.PRIVATE,
      userId,
    },
  });
}

export async function getResumeBySlug(slug: string) {
  return prisma.resume.findUnique({
    where: { slug },
    include: {
      experiences: { orderBy: { order: "asc" } },
      projects: { orderBy: { order: "asc" } },
    },
  });
}

export async function listUserResumes(userId: string) {
  return prisma.resume.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      slug: true,
      visibility: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}
