import { CourseLevel, Role, UserStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const ADMIN_ROLES: Role[] = [Role.ADMIN, Role.SUPER_ADMIN];
const DEFAULT_ADMIN_ID = process.env.NEXT_PUBLIC_DEMO_ADMIN_ID ?? "user_admin";

export async function requireAdminUser(userId?: string) {
  const admin = await prisma.user.findUnique({
    where: { id: userId ?? DEFAULT_ADMIN_ID },
    include: { profile: true },
  });

  if (!admin || !ADMIN_ROLES.includes(admin.role)) {
    throw new Error("Not authorized");
  }

  return admin;
}

export async function getAdminOverview() {
  const [courses, students, jobs, enrollments] = await Promise.all([
    prisma.course.count(),
    prisma.user.count({ where: { role: Role.STUDENT } }),
    prisma.jobOpportunity.count(),
    prisma.enrollment.count(),
  ]);

  const recentCourses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const recentStudents = await prisma.user.findMany({
    where: { role: Role.STUDENT },
    orderBy: { createdAt: "desc" },
    take: 4,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      status: true,
      createdAt: true,
    },
  });

  const recentJobs = await prisma.jobOpportunity.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
    select: {
      id: true,
      title: true,
      company: true,
      location: true,
      createdAt: true,
    },
  });

  return {
    stats: {
      courses,
      students,
      jobs,
      enrollments,
    },
    recentCourses,
    recentStudents,
    recentJobs,
  };
}

export async function listAdminCourses() {
  return prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      level: true,
      createdAt: true,
      enrollments: { select: { id: true } },
    },
  });
}

interface CreateCourseInput {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  level: CourseLevel;
  coverImage: string;
}

export async function createAdminCourse(input: CreateCourseInput) {
  const instructor = await prisma.user.findFirst({ where: { role: Role.TUTOR } });

  return prisma.course.create({
    data: {
      slug: input.slug,
      title: input.title,
      tagline: input.tagline,
      description: input.description,
      category: input.category,
      level: input.level,
      coverImage: input.coverImage,
      instructorId: instructor?.id ?? DEFAULT_ADMIN_ID,
    },
  });
}

export async function listStudents() {
  return prisma.user.findMany({
    where: { role: Role.STUDENT },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function updateStudentStatus(userId: string, status: UserStatus) {
  return prisma.user.update({
    where: { id: userId },
    data: { status },
  });
}

export async function listAdminJobs() {
  return prisma.jobOpportunity.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      company: true,
      location: true,
      jobType: true,
      remoteOption: true,
      createdAt: true,
    },
  });
}

interface CreateJobInput {
  title: string;
  company: string;
  location: string;
  country: string;
  jobType: string;
  remoteOption: string;
}

export async function createJobPosting(input: CreateJobInput) {
  return prisma.jobOpportunity.create({
    data: {
      title: input.title,
      company: input.company,
      location: input.location,
      country: input.country,
      jobType: input.jobType as any,
      remoteOption: input.remoteOption as any,
      postedById: DEFAULT_ADMIN_ID,
    },
  });
}
