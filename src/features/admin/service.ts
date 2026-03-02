import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];
const DEFAULT_ADMIN_ID = process.env.NEXT_PUBLIC_DEMO_ADMIN_ID ?? "user_admin";

export async function requireAdminUser(userId?: string) {
  const admin = await prisma.user.findUnique({
    where: { id: userId ?? DEFAULT_ADMIN_ID },
  });

  if (!admin || !ADMIN_ROLES.includes(admin.role)) {
    throw new Error("Not authorized");
  }

  return admin;
}

export async function getAdminOverview() {
  const [studentCount, jobCount, recentStudents, recentJobs] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.jobOpportunity.count({ where: { isActive: true } }),
    prisma.user.findMany({ where: { role: 'STUDENT' }, take: 4, orderBy: { createdAt: 'desc' } }),
    prisma.jobOpportunity.findMany({ where: { isActive: true }, take: 3, orderBy: { createdAt: 'desc' } }),
  ]);

  return {
    stats: {
      courses: 0,
      students: studentCount,
      jobs: jobCount,
      enrollments: 0,
    },
    recentCourses: [],
    recentStudents,
    recentJobs,
  };
}

export async function listAdminCourses() {
  return prisma.course.findMany({ take: 100 });
}

export async function listCourses() {
  return prisma.course.findMany({ take: 100 });
}

export async function createAdminCourse(input: {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  coverImage: string;
}) {
  return prisma.course.create({
    data: {
      slug: input.slug,
      title: input.title,
      tagline: input.tagline,
      description: input.description,
      category: input.category,
      level: input.level,
      coverImage: input.coverImage,
      instructorId: DEFAULT_ADMIN_ID,
    },
  });
}

export async function createCourse(input: {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  coverImage: string;
}) {
  return createAdminCourse(input);
}

export async function listStudents() {
  return prisma.user.findMany({ where: { role: 'STUDENT' }, take: 100 });
}

export async function updateStudentStatus(userId: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') {
  return prisma.user.update({
    where: { id: userId },
    data: { status },
  });
}

export async function listAllUsers(filters?: {
  role?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const { role, page = 1, limit = 20 } = filters || {};
  
  const where: any = {};
  if (role) where.role = role;

  let users = await prisma.user.findMany({ where, take: 100 });
  
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    users = users.filter(user =>
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  }

  const skip = (page - 1) * limit;
  const paginatedUsers = users.slice(skip, skip + limit);

  return {
    users: paginatedUsers,
    pagination: {
      page,
      limit,
      total: users.length,
      totalPages: Math.ceil(users.length / limit),
    },
  };
}

export async function updateUserRole(userId: string, role: 'ADMIN' | 'SUPER_ADMIN' | 'STUDENT' | 'TUTOR') {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
  });
}

export async function updateUserStatus(userId: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') {
  return prisma.user.update({
    where: { id: userId },
    data: { status },
  });
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
  });
}

export async function listAdminJobs() {
  return prisma.jobOpportunity.findMany({ take: 100 });
}

export async function getAnalyticsOverview() {
  const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
  const totalTutors = await prisma.user.count({ where: { role: 'TUTOR' } });
  const totalJobs = await prisma.jobOpportunity.count();
  const totalApplications = await prisma.jobApplication.count();

  return {
    overview: {
      totalUsers: totalStudents + totalTutors,
      totalStudents,
      totalTutors,
      totalAdmins: 1,
      totalCourses: 0,
      totalEnrollments: 0,
      totalJobs,
      totalApplications,
      totalForumThreads: 0,
      totalForumPosts: 0,
      totalResumes: 0,
    },
    metrics: {
      completionRate: 0,
      placementRate: 0,
      recentEnrollments: 0,
      recentApplications: 0,
    },
    topCourses: [],
    recentUsers: [],
    courseCompletionStats: [],
    jobPlacementStats: [],
    userGrowthStats: [],
  };
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
      description: '',
      requirements: [],
      tags: [],
      featured: false,
      isActive: true,
      postedById: DEFAULT_ADMIN_ID,
    },
  });
}
