import { prisma } from "@/lib/prisma";

export interface SearchResult {
  type: "course" | "job" | "forum" | "news";
  id: string;
  title: string;
  description?: string;
  url: string;
  metadata?: Record<string, any>;
}

export async function searchAll(query: string, limit = 10): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const [courses, jobs, threads, news] = await Promise.all([
    // Courses
    prisma.course.findMany({
      where: {
        OR: [
          { title: { contains: trimmed, mode: "insensitive" } },
          { description: { contains: trimmed, mode: "insensitive" } },
          { category: { contains: trimmed, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        category: true,
      },
      take: limit,
    }),
    // Jobs
    prisma.jobOpportunity.findMany({
      where: {
        OR: [
          { title: { contains: trimmed, mode: "insensitive" } },
          { company: { contains: trimmed, mode: "insensitive" } },
          { location: { contains: trimmed, mode: "insensitive" } },
          { description: { contains: trimmed, mode: "insensitive" } },
          { tags: { has: trimmed } },
        ],
      },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        description: true,
        jobType: true,
      },
      take: limit,
    }),
    // Forum threads
    prisma.forumThread.findMany({
      where: {
        OR: [
          { title: { contains: trimmed, mode: "insensitive" } },
          {
            posts: {
              some: {
                content: { contains: trimmed, mode: "insensitive" },
              },
            },
          },
        ],
      },
      include: {
        course: {
          select: {
            title: true,
            slug: true,
          },
        },
        _count: {
          select: { posts: true },
        },
      },
      take: limit,
    }),
    // News
    prisma.news.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: trimmed, mode: "insensitive" } },
          { content: { contains: trimmed, mode: "insensitive" } },
          { summary: { contains: trimmed, mode: "insensitive" } },
          { tags: { has: trimmed } },
        ],
      },
      select: {
        id: true,
        title: true,
        summary: true,
        slug: true,
        publishedAt: true,
      },
      take: limit,
    }),
  ]);

  const results: SearchResult[] = [
    ...courses.map((course) => ({
      type: "course" as const,
      id: course.id,
      title: course.title,
      description: course.description,
      url: `/courses/${course.slug}`,
      metadata: { category: course.category },
    })),
    ...jobs.map((job) => ({
      type: "job" as const,
      id: job.id,
      title: job.title,
      description: `${job.company} · ${job.location} · ${job.jobType.toLowerCase().replace("_", " ")}`,
      url: `/jobs/${job.id}`,
      metadata: { company: job.company, location: job.location },
    })),
    ...threads.map((thread) => ({
      type: "forum" as const,
      id: thread.id,
      title: thread.title,
      description: `${thread.course.title} · ${thread._count.posts} posts`,
      url: `/forum/${thread.id}`,
      metadata: { course: thread.course.title, posts: thread._count.posts },
    })),
    ...news.map((article) => ({
      type: "news" as const,
      id: article.id,
      title: article.title,
      description: article.summary || undefined,
      url: `/news/${article.slug}`,
      metadata: { publishedAt: article.publishedAt },
    })),
  ];

  return results.slice(0, limit);
}
