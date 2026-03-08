import { prisma } from "@/lib/prisma";

export async function getStudentEnrollments(userId: string, limit?: number) {
  return prisma.enrollment.findMany({
    where: { userId },
    include: { course: true },
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

export async function getDashboardSummary(userId: string) {
  const [enrollmentsCount, resumesCount, jobApplicationsCount, volunteerApplicationsCount] = await Promise.all([
    prisma.enrollment.count({ where: { userId } }),
    prisma.resume.count({ where: { userId } }),
    prisma.jobApplication.count({ where: { userId } }),
    prisma.volunteerApplication.count({ where: { userId } }),
  ]);

  return {
    enrollmentsCount,
    resumesCount,
    applicationsCount: jobApplicationsCount + volunteerApplicationsCount,
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
