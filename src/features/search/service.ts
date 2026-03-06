import { prisma } from "@/lib/prisma";

type JobSearchMetadata = {
  company: string;
  location: string;
};

type CourseSearchMetadata = {
  category: string;
};

type SearchMetadata = JobSearchMetadata | CourseSearchMetadata;

export interface SearchResult {
  type: "course" | "job" | "forum" | "news";
  id: string;
  title: string;
  description?: string;
  url: string;
  metadata?: SearchMetadata;
}

export async function searchAll(query: string, limit = 10): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const searchLower = trimmed.toLowerCase();

  const [jobs, courses] = await Promise.all([
    prisma.jobOpportunity.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: searchLower, mode: 'insensitive' } },
          { company: { contains: searchLower, mode: 'insensitive' } },
          { description: { contains: searchLower, mode: 'insensitive' } },
        ],
      },
      take: limit,
    }),
    prisma.course.findMany({
      where: {
        OR: [
          { title: { contains: searchLower, mode: 'insensitive' } },
          { description: { contains: searchLower, mode: 'insensitive' } },
        ],
      },
      take: limit,
    }),
  ]);

  const results: SearchResult[] = [
    ...jobs.map((job) => ({
      type: "job" as const,
      id: job.id,
      title: job.title,
      description: `${job.company} · ${job.location} · ${job.jobType.toLowerCase().replace("_", " ")}`,
      url: `/jobs/${job.slug || job.id}`,
      metadata: { company: job.company, location: job.location },
    })),
    ...courses.map((course) => ({
      type: "course" as const,
      id: course.id,
      title: course.title,
      description: course.description,
      url: `/courses/${course.slug}`,
      metadata: { category: course.category },
    })),
  ];

  return results.slice(0, limit);
}
