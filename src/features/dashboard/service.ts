import { prisma } from "@/lib/prisma";

export async function getStudentEnrollments(userId: string) {
  return prisma.enrollment.findMany({
    where: { userId },
    include: { course: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getStudentResumes(userId: string) {
  return prisma.resume.findMany({
    where: { userId },
    include: { experiences: true, projects: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getStudentApplications(userId: string) {
  const jobApplications = await prisma.jobApplication.findMany({
    where: { userId },
    include: { opportunity: true, resume: true },
    orderBy: { submittedAt: 'desc' },
  });

  const volunteerApplications = await prisma.volunteerApplication.findMany({
    where: { userId },
    include: { opportunity: true },
    orderBy: { submittedAt: 'desc' },
  });

  return {
    jobs: jobApplications,
    volunteer: volunteerApplications,
  };
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
    },
  });
}
