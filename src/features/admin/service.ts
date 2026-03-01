import * as FirestoreService from "@/lib/firestore-service";

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];
const DEFAULT_ADMIN_ID = process.env.NEXT_PUBLIC_DEMO_ADMIN_ID ?? "user_admin";

export async function requireAdminUser(userId?: string) {
  const admin = await FirestoreService.findUserById(userId ?? DEFAULT_ADMIN_ID);

  if (!admin || !ADMIN_ROLES.includes(admin.role)) {
    throw new Error("Not authorized");
  }

  return admin;
}

export async function getAdminOverview() {
  const [students, jobs, recentStudents, recentJobs] = await Promise.all([
    FirestoreService.countUsers({ role: 'STUDENT' }),
    FirestoreService.listJobs({ isActive: true }, 1, 1000),
    FirestoreService.listUsers({ role: 'STUDENT' }, 4),
    FirestoreService.listJobs({ isActive: true }, 1, 3),
  ]);

  return {
    stats: {
      courses: 0,
      students,
      jobs: jobs.total,
      enrollments: 0,
    },
    recentCourses: [],
    recentStudents,
    recentJobs: recentJobs.jobs,
  };
}

export async function listAdminCourses() {
  const { courses } = await FirestoreService.listCourses(1, 100);
  return courses;
}

export async function listCourses() {
  const { courses } = await FirestoreService.listCourses(1, 100);
  return courses;
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
  return FirestoreService.createCourse({
    slug: input.slug,
    title: input.title,
    tagline: input.tagline,
    description: input.description,
    category: input.category,
    level: input.level,
    coverImage: input.coverImage,
    instructorId: DEFAULT_ADMIN_ID,
    certificateAvailable: false,
    outcomes: [],
    skills: [],
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
  return FirestoreService.listUsers({ role: 'STUDENT' }, 100);
}

export async function updateStudentStatus(userId: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') {
  await FirestoreService.updateUser(userId, { status });
  return FirestoreService.findUserById(userId);
}

export async function listAllUsers(filters?: {
  role?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const { role, page = 1, limit = 20 } = filters || {};
  
  let users = await FirestoreService.listUsers(role ? { role } : undefined, 100);
  
  // Client-side search filtering
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
  await FirestoreService.updateUser(userId, { role });
  return FirestoreService.findUserById(userId);
}

export async function updateUserStatus(userId: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') {
  await FirestoreService.updateUser(userId, { status });
  return FirestoreService.findUserById(userId);
}

export async function getUserById(userId: string) {
  return FirestoreService.findUserById(userId);
}

export async function listAdminJobs() {
  const { jobs } = await FirestoreService.listJobs({}, 1, 100);
  return jobs;
}

export async function getAnalyticsOverview() {
  const totalStudents = await FirestoreService.countUsers({ role: 'STUDENT' });
  const totalTutors = await FirestoreService.countUsers({ role: 'TUTOR' });
  const { total: totalJobs } = await FirestoreService.listJobs({}, 1, 1);
  const { total: totalApplications } = await FirestoreService.listApplicationsByJob('', 1, 1);

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
  return FirestoreService.createJob({
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
  });
}
