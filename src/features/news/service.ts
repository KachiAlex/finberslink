import { prisma } from "@/lib/prisma";
import { NEWS_STATUSES } from "./constants";

export async function createNewsPost(input: {
  title: string;
  content: string;
  summary?: string;
  tags?: string[];
  authorId: string;
}) {
  const slug = input.title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return prisma.news.create({
    data: {
      slug,
      title: input.title,
      content: input.content,
      summary: input.summary,
      tags: input.tags || [],
      status: "DRAFT",
      authorId: input.authorId,
    },
  });
}

export async function listNewsPosts(limit = 20) {
  return prisma.news.findMany({
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function listPublishedNewsPosts(limit = 20) {
  return prisma.news.findMany({
    where: { status: "PUBLISHED" },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

export async function getNewsPostBySlug(slug: string) {
  return prisma.news.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

export async function updateNewsPost(id: string, input: {
  title?: string;
  content?: string;
  summary?: string;
  tags?: string[];
  status?: (typeof NEWS_STATUSES)[number];
}) {
  return prisma.news.update({
    where: { id },
    data: input,
  });
}

export async function deleteNewsPost(id: string) {
  return prisma.news.delete({
    where: { id },
  });
}
