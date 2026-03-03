import { prisma } from "@/lib/prisma";

import { NEWS_STATUSES } from "./constants";

const AUTHOR_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
};

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

async function ensureUniqueSlug(base: string) {
  let slug = base || "news";
  let counter = 1;

  while (await prisma.news.findUnique({ where: { slug } })) {
    slug = `${base}-${counter}`;
    counter += 1;
  }

  return slug;
}

export async function createNewsPost(input: {
  title: string;
  content: string;
  summary?: string;
  tags?: string[];
  authorId: string;
}) {
  const baseSlug = slugify(input.title);
  const slug = await ensureUniqueSlug(baseSlug);

  return prisma.news.create({
    data: {
      slug,
      title: input.title,
      content: input.content,
      summary: input.summary ?? null,
      tags: input.tags ?? [],
      authorId: input.authorId,
      status: "DRAFT",
    },
    include: {
      author: { select: AUTHOR_SELECT },
    },
  });
}

export async function listNewsPosts(limit = 20) {
  return prisma.news.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      author: { select: AUTHOR_SELECT },
    },
  });
}

export async function listPublishedNewsPosts(limit = 20) {
  return prisma.news.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: {
      author: { select: AUTHOR_SELECT },
    },
  });
}

export async function getNewsPostBySlug(slug: string) {
  return prisma.news.findUnique({
    where: { slug },
    include: {
      author: { select: AUTHOR_SELECT },
    },
  });
}

export async function updateNewsPost(
  id: string,
  input: {
    title?: string;
    content?: string;
    summary?: string;
    tags?: string[];
    status?: (typeof NEWS_STATUSES)[number];
  }
) {
  const data: any = {};

  if (input.title) {
    data.title = input.title;
  }
  if (input.content) {
    data.content = input.content;
  }
  if (input.summary !== undefined) {
    data.summary = input.summary;
  }
  if (input.tags) {
    data.tags = input.tags;
  }
  if (input.status) {
    if (!NEWS_STATUSES.includes(input.status)) {
      throw new Error(`Invalid news status: ${input.status}`);
    }
    data.status = input.status;
    if (input.status === "PUBLISHED") {
      data.publishedAt = new Date();
    }
  }

  if (Object.keys(data).length === 0) {
    return prisma.news.findUnique({
      where: { id },
      include: { author: { select: AUTHOR_SELECT } },
    });
  }

  return prisma.news.update({
    where: { id },
    data,
    include: {
      author: { select: AUTHOR_SELECT },
    },
  });
}

export async function deleteNewsPost(id: string) {
  return prisma.news.delete({
    where: { id },
  });
}
