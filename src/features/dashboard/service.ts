import { prisma } from "@/lib/prisma";

export async function getStudentEnrollments(userId: string) {
  return prisma.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        select: {
          id: true,
          slug: true,
          title: true,
          category: true,
          level: true,
          coverImage: true,
          instructor: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: { lastAccessedAt: "desc" },
  });
}

export async function getStudentResumes(userId: string) {
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

export async function getStudentApplications(userId: string) {
  const [jobApps, volunteerApps] = await Promise.all([
    prisma.jobApplication.findMany({
      where: { userId },
      include: {
        opportunity: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            jobType: true,
            remoteOption: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.volunteerApplication.findMany({
      where: { userId },
      include: {
        opportunity: {
          select: {
            id: true,
            title: true,
            organization: true,
            location: true,
            commitment: true,
            isRemote: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    }),
  ]);

  return {
    jobs: jobApps,
    volunteer: volunteerApps,
  };
}
