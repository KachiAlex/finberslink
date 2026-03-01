import * as FirestoreService from "@/lib/firestore-service";

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

  const [jobsResult, coursesResult] = await Promise.all([
    FirestoreService.searchJobs(trimmed, 1, limit),
    FirestoreService.listCourses(1, limit),
  ]);

  const results: SearchResult[] = [
    ...jobsResult.jobs.map((job) => ({
      type: "job" as const,
      id: job.id,
      title: job.title,
      description: `${job.company} · ${job.location} · ${job.jobType.toLowerCase().replace("_", " ")}`,
      url: `/jobs/${job.id}`,
      metadata: { company: job.company, location: job.location },
    })),
    ...coursesResult.courses.map((course) => ({
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
