// Removed import of randomBytes; using fallback token generator
import type {
  CourseApprovalStatus,
  InviteStatus,
  JobApplicationStatus,
  JobType,
  Prisma,
  RemoteOption,
  Role,
  UserStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];
const FEATURE_FLAG_BLUEPRINT = [
  {
    key: 'aiCourseQa',
    name: 'AI Course QA',
    description: 'Use AI to run pre-flight checks on new syllabi before publish.',
    defaultEnabled: process.env.NEXT_PUBLIC_AI_COURSE_QA === 'true',
  },
  {
    key: 'jobAutoSync',
    name: 'Job board auto-sync',
    description: 'Mirror approved jobs to partner marketplaces automatically.',
    defaultEnabled: process.env.NEXT_PUBLIC_JOB_AUTO_SYNC === 'true',
  },
  {
    key: 'guardianMode',
    name: 'Guardian monitoring',
    description: 'Extra fraud detection for tutor payouts and employer invites.',
    defaultEnabled: process.env.NEXT_PUBLIC_GUARDIAN_MODE === 'true',
  },
];

const featureFlagOverrides: Record<string, boolean> = {};

type AdminUserWithTenant = Prisma.UserGetPayload<{ include: { tenant: true } }>;

function isSuperAdmin(admin: AdminUserWithTenant) {
  return admin.role === "SUPER_ADMIN";
}

function getTenantContext(admin: AdminUserWithTenant) {
  if (isSuperAdmin(admin)) {
    return undefined;
  }

  if (!admin.tenantId) {
    throw new Error("Admin is not associated with a tenant");
  }

  return admin.tenantId;
}

function buildUserTenantWhere(admin: AdminUserWithTenant): Prisma.UserWhereInput {
  const tenantId = getTenantContext(admin);
  return tenantId ? { tenantId } : {};
}

function buildCourseTenantWhere(admin: AdminUserWithTenant): Prisma.CourseWhereInput {
  const tenantId = getTenantContext(admin);
  return tenantId ? { instructor: { tenantId } } : {};
}

function buildJobTenantWhere(admin: AdminUserWithTenant): Prisma.JobOpportunityWhereInput {
  const tenantId = getTenantContext(admin);
  return tenantId ? { postedBy: { tenantId } } : {};
}

async function resolveAdmin(admin?: AdminUserWithTenant, options?: { allowNoTenant?: boolean }) {
  if (admin) {
    return admin;
  }

  return requireAdminUser(undefined, options);
}

export async function requireAdminUser(
  userId?: string,
  options?: { allowNoTenant?: boolean },
): Promise<AdminUserWithTenant> {
  let resolvedUserId = userId;

  if (!resolvedUserId) {
    const session = await requireSession({
      allowedRoles: ADMIN_ROLES as Role[],
      requireTenant: !(options?.allowNoTenant ?? false),
      failureMode: "error",
    });
    resolvedUserId = session.sub;
  }

  const admin = await prisma.user.findUnique({
    where: { id: resolvedUserId },
    include: {
      tenant: true,
    },
  });

  if (!admin || !ADMIN_ROLES.includes(admin.role)) {
    throw new Error("Not authenticated");
  }

  const allowNoTenant = options?.allowNoTenant || admin.role === 'SUPER_ADMIN';

  if (!admin.tenantId && !allowNoTenant) {
    throw new Error("Admin is not associated with a tenant");
  }

  return admin;
}

export async function getTenantAdminDashboard(admin?: AdminUserWithTenant) {
  try {
    const resolvedAdmin = await resolveAdmin(admin);
    const tenantUserWhere = buildUserTenantWhere(resolvedAdmin);

    const [overview, courseSnapshot, tutorCount] = await Promise.all([
      getAdminOverview(resolvedAdmin),
      getCourseManagementSnapshot(resolvedAdmin),
      prisma.user.count({ where: { role: 'TUTOR', ...tenantUserWhere } }),
    ]);

    return {
      overview,
      courseSnapshot,
      tutorCount,
    };
  } catch (error) {
    console.error("Error loading admin dashboard:", error);
    // Return empty data structure on error
    return {
      overview: {
        stats: { courses: 0, students: 0, jobs: 0, enrollments: 0 },
        recentCourses: [],
        recentStudents: [],
        recentJobs: [],
      },
      courseSnapshot: { totals: { totalCourses: 0, tutorLedCourses: 0, adminDrafts: 0 }, levelMap: {}, recentCourses: [] },
      tutorCount: 0,
    };
  }
}

export async function getAdminOverview(admin?: AdminUserWithTenant) {
  const resolvedAdmin = await resolveAdmin(admin);
  const tenantUserWhere = buildUserTenantWhere(resolvedAdmin);
  const tenantJobWhere = buildJobTenantWhere(resolvedAdmin);

  const [studentCount, jobCount, recentStudents, recentJobs] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT', ...tenantUserWhere } }),
    prisma.jobOpportunity.count({ where: { isActive: true, ...tenantJobWhere } }),
    prisma.user.findMany({ where: { role: 'STUDENT', ...tenantUserWhere }, take: 4, orderBy: { createdAt: 'desc' } }),
    prisma.jobOpportunity.findMany({ where: { isActive: true, ...tenantJobWhere }, take: 3, orderBy: { createdAt: 'desc' } }),
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

export async function getSystemSnapshot(admin?: AdminUserWithTenant) {
  const resolvedAdmin = await resolveAdmin(admin, { allowNoTenant: true });
  if (!isSuperAdmin(resolvedAdmin)) {
    throw new Error("System snapshot is only available to super admins");
  }

  const [
    adminUsers,
    totalUsers,
    invitedUsers,
    suspendedUsers,
    recentJobs,
    recentCourses,
    recentUserUpdates,
  ] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
      orderBy: { createdAt: 'asc' },
      take: 12,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        tenantId: true,
        createdAt: true,
        _count: {
          select: {
            jobOpportunitiesPosted: true,
            coursesTaught: true,
          },
        },
      },
    }),
    prisma.user.count(),
    prisma.user.count({ where: { status: 'INVITED' } }),
    prisma.user.count({ where: { status: 'SUSPENDED' } }),
    prisma.jobOpportunity.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        company: true,
        updatedAt: true,
        isActive: true,
      },
    }),
    prisma.course.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
    }),
    prisma.user.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    }),
  ]);

  const auditTrail = [
    ...recentJobs.map((job) => ({
      id: `job-${job.id}`,
      type: 'job' as const,
      label: job.title,
      meta: job.company,
      timestamp: job.updatedAt,
      status: job.isActive ? 'Live' : 'Draft',
    })),
    ...recentCourses.map((course) => ({
      id: `course-${course.id}`,
      type: 'course' as const,
      label: course.title,
      meta: 'Course release',
      timestamp: course.updatedAt,
      status: 'Updated',
    })),
    ...recentUserUpdates.map((user) => ({
      id: `user-${user.id}`,
      type: 'user' as const,
      label: `${user.firstName} ${user.lastName}`,
      meta: user.role.replace("_", " "),
      timestamp: user.updatedAt,
      status: user.status.toLowerCase(),
    })),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 8);

  const featureFlags = FEATURE_FLAG_BLUEPRINT.map((flag) => {
    const hasOverride = typeof featureFlagOverrides[flag.key] === 'boolean';
    return {
      key: flag.key,
      name: flag.name,
      description: flag.description,
      enabled: hasOverride ? featureFlagOverrides[flag.key]! : flag.defaultEnabled,
      source: hasOverride ? 'override' : 'env',
    };
  });

  return {
    adminUsers,
    stats: {
      totalUsers,
      admins: adminUsers.length,
      superAdmins: adminUsers.filter((user) => user.role === 'SUPER_ADMIN').length,
      invitedUsers,
      suspendedUsers,
    },
    featureFlags,
    auditTrail,
  };
}

export async function toggleFeatureFlag(key: string, enabled: boolean) {
  const flagDefinition = FEATURE_FLAG_BLUEPRINT.find((flag) => flag.key === key);
  if (!flagDefinition) {
    throw new Error(`Unknown feature flag: ${key}`);
  }

  featureFlagOverrides[key] = enabled;
}

export async function getCourseManagementSnapshot(admin?: AdminUserWithTenant) {
  const resolvedAdmin = await resolveAdmin(admin);
  const tenantCourseWhere = buildCourseTenantWhere(resolvedAdmin);
  const tenantId = getTenantContext(resolvedAdmin);

  const [totalCourses, tutorLedCourses, adminDrafts, levelGroups, recentCourses] = await Promise.all([
    prisma.course.count({ where: tenantCourseWhere }),
    prisma.course.count({
      where: {
        instructor: {
          role: 'TUTOR',
          ...(tenantId ? { tenantId } : {}),
        },
      },
    }),
    prisma.course.count({
      where: {
        instructor: {
          role: 'ADMIN',
          ...(tenantId ? { tenantId } : {}),
        },
      },
    }),
    prisma.course.groupBy({
      by: ['level'],
      _count: {
        level: true,
      },
      where: tenantCourseWhere,
    }),
    prisma.course.findMany({
      where: tenantCourseWhere,
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    }),
  ]);

  const levelMap: Record<string, number> = {
    BEGINNER: 0,
    INTERMEDIATE: 0,
    ADVANCED: 0,
  };

  for (const group of levelGroups) {
    levelMap[group.level] = group._count.level;
  }

  return {
    totals: {
      totalCourses,
      tutorLedCourses,
      adminDrafts,
    },
    levelMap,
    recentCourses: recentCourses.map(course => ({
      id: course.id,
      title: course.title,
      level: course.level,
      category: course.category,
      createdAt: course.createdAt,
      approvalStatus: course.approvalStatus,
      instructor: course.instructor
        ? {
            firstName: course.instructor.firstName,
            lastName: course.instructor.lastName,
            role: course.instructor.role,
          }
        : null,
    })),
  };
}

export async function updateCourseApprovalStatus(courseId: string, status: CourseApprovalStatus, admin?: AdminUserWithTenant) {
  if (!courseId) {
    throw new Error("Course ID is required");
  }

  const resolvedAdmin = await resolveAdmin(admin);
  const tenantCourseWhere = buildCourseTenantWhere(resolvedAdmin);

  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      ...tenantCourseWhere,
    },
    select: { id: true },
  });

  if (!course) {
    throw new Error("Course not found or access denied");
  }

  return prisma.course.update({
    where: { id: courseId },
    data: { approvalStatus: status },
  });
}

export async function listAdminCourses(admin?: AdminUserWithTenant) {
  const resolvedAdmin = await resolveAdmin(admin);
  const tenantCourseWhere = buildCourseTenantWhere(resolvedAdmin);

  return prisma.course.findMany({
    where: tenantCourseWhere,
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: {
      instructor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  });
}

function generateInviteToken(): string {
  // Simple fallback token generator
  return Math.random().toString(36).substring(2, 14);
}

export async function createTenantInvite(input: {
  tenantId: string;
  email: string;
  role: Extract<Role, 'STUDENT' | 'TUTOR'>;
  createdById: string;
  expiresAt?: Date;
}) {
  return prisma.tenantInvite.create({
    data: {
      tenantId: input.tenantId,
      email: input.email.toLowerCase(),
      role: input.role,
      token: generateInviteToken(),
      expiresAt: input.expiresAt ?? new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
      createdById: input.createdById,
    },
  });
}

export async function listTenantInvites(tenantId: string, status: InviteStatus[] = ['PENDING']) {
  return prisma.tenantInvite.findMany({
    where: {
      tenantId,
      status: { in: status },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      createdBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

export async function getInviteByToken(token: string) {
  const invite = await prisma.tenantInvite.findUnique({
    where: { token },
    include: {
      tenant: true,
    },
  });

  if (!invite) {
    return null;
  }

  if (invite.status !== 'PENDING') {
    return invite;
  }

  if (invite.expiresAt < new Date()) {
    return prisma.tenantInvite.update({
      where: { id: invite.id },
      data: { status: 'EXPIRED' },
      include: {
        tenant: true,
      },
    });
  }

  return invite;
}

export async function markInviteStatus(inviteId: string, status: InviteStatus) {
  return prisma.tenantInvite.update({
    where: { id: inviteId },
    data: { status },
  });
}

export async function createAdminCourse(
  input: {
    slug: string;
    title: string;
    tagline: string;
    description: string;
    category: string;
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    coverImage: string;
  },
  admin?: AdminUserWithTenant,
) {
  const resolvedAdmin = await resolveAdmin(admin);
  const instructorId = resolvedAdmin.id;

  return prisma.course.create({
    data: {
      slug: input.slug,
      title: input.title,
      tagline: input.tagline,
      description: input.description,
      category: input.category,
      level: input.level,
      coverImage: input.coverImage,
      instructorId,
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

export async function listStudents(admin?: AdminUserWithTenant) {
  const resolvedAdmin = await resolveAdmin(admin);
  const tenantWhere = buildUserTenantWhere(resolvedAdmin);

  return prisma.user.findMany({
    where: { role: 'STUDENT', ...tenantWhere },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function updateStudentStatus(userId: string, status: UserStatus, admin?: AdminUserWithTenant) {
  const resolvedAdmin = await resolveAdmin(admin);
  const tenantWhere = buildUserTenantWhere(resolvedAdmin);

  if (!isSuperAdmin(resolvedAdmin)) {
    const student = await prisma.user.findFirst({
      where: { id: userId, role: 'STUDENT', ...tenantWhere },
    });

    if (!student) {
      throw new Error('Student does not belong to your tenant');
    }
  }

  return prisma.user.update({
    where: { id: userId },
    data: { status },
  });
}

export async function listAllUsers(filters?: {
  role?: Role;
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
}, admin?: AdminUserWithTenant) {
  const resolvedAdmin = await resolveAdmin(admin);
  const page = Math.max(filters?.page ?? 1, 1);
  const limit = filters?.limit ?? 20;

  const where: Prisma.UserWhereInput = { ...buildUserTenantWhere(resolvedAdmin) };

  if (filters?.role) {
    where.role = filters.role;
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        profile: {
          select: {
            headline: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            jobApplications: true,
            forumThreads: true,
          },
        },
      },
    }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
  };
}

export async function listTutors(filters?: {
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
}, admin?: AdminUserWithTenant) {
  const resolvedAdmin = await resolveAdmin(admin);
  const page = Math.max(filters?.page ?? 1, 1);
  const limit = filters?.limit ?? 20;

  const where: Prisma.UserWhereInput = {
    role: 'TUTOR',
    ...buildUserTenantWhere(resolvedAdmin),
  };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [total, tutors] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        profile: true,
        _count: {
          select: {
            coursesTaught: true,
            enrollments: true,
            jobApplications: true,
          },
        },
        coursesTaught: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            level: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    }),
  ]);

  return {
    tutors,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
  };
}

export async function getTutorManagementSnapshot(admin?: AdminUserWithTenant) {
  const resolvedAdmin = await resolveAdmin(admin);
  const tenantId = getTenantContext(resolvedAdmin);
  const tenantWhere = buildUserTenantWhere(resolvedAdmin);

  const [totalTutors, activeTutors, invitedTutors, suspendedTutors, recentTutorCourses] = await Promise.all([
    prisma.user.count({ where: { role: 'TUTOR', ...tenantWhere } }),
    prisma.user.count({ where: { role: 'TUTOR', status: 'ACTIVE', ...tenantWhere } }),
    prisma.user.count({ where: { role: 'TUTOR', status: 'INVITED', ...tenantWhere } }),
    prisma.user.count({ where: { role: 'TUTOR', status: 'SUSPENDED', ...tenantWhere } }),
    prisma.course.findMany({
      where: {
        instructor: {
          role: 'TUTOR',
          ...(tenantId ? { tenantId } : {}),
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return {
    totals: {
      totalTutors,
      activeTutors,
      invitedTutors,
      suspendedTutors,
    },
    recentTutorCourses,
  };
}

export async function updateUserRole(userId: string, role: 'ADMIN' | 'SUPER_ADMIN' | 'STUDENT' | 'TUTOR', admin?: AdminUserWithTenant) {
  const resolvedAdmin = await resolveAdmin(admin, { allowNoTenant: true });
  if (!isSuperAdmin(resolvedAdmin)) {
    throw new Error('Only super admins can change user roles');
  }

  return prisma.user.update({
    where: { id: userId },
    data: { role },
  });
}

export async function updateUserStatus(userId: string, status: UserStatus, admin?: AdminUserWithTenant) {
  const resolvedAdmin = await resolveAdmin(admin);
  const tenantWhere = buildUserTenantWhere(resolvedAdmin);

  if (!isSuperAdmin(resolvedAdmin)) {
    const targetUser = await prisma.user.findFirst({
      where: { id: userId, ...tenantWhere },
    });

    if (!targetUser) {
      throw new Error('User does not belong to your tenant');
    }
  }

  return prisma.user.update({
    where: { id: userId },
    data: { status },
  });
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        select: {
          headline: true,
          location: true,
        },
      },
      _count: {
        select: {
          enrollments: true,
          jobApplications: true,
          forumThreads: true,
          forumPosts: true,
          resumes: true,
        },
      },
      jobApplications: {
        select: {
          id: true,
          status: true,
          opportunity: {
            select: {
              title: true,
              company: true,
            },
          },
        },
        orderBy: { submittedAt: "desc" },
        take: 5,
      },
    },
  });
}

export async function listAdminJobs(admin?: AdminUserWithTenant) {
  const resolvedAdmin = await resolveAdmin(admin);
  const tenantJobWhere = buildJobTenantWhere(resolvedAdmin);

  return prisma.jobOpportunity.findMany({
    where: tenantJobWhere,
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: {
      postedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      _count: {
        select: {
          applications: true,
        },
      },
    },
  });
}

export async function updateJobVisibility(jobId: string, updates: { isActive?: boolean; featured?: boolean }, admin?: AdminUserWithTenant) {
  const resolvedAdmin = await resolveAdmin(admin);
  const tenantJobWhere = buildJobTenantWhere(resolvedAdmin);

  if (!isSuperAdmin(resolvedAdmin)) {
    const job = await prisma.jobOpportunity.findFirst({
      where: { id: jobId, ...tenantJobWhere },
    });

    if (!job) {
      throw new Error('Job does not belong to your tenant');
    }
  }

  return prisma.jobOpportunity.update({
    where: { id: jobId },
    data: updates,
  });
}

export async function getJobManagementSnapshot(admin?: AdminUserWithTenant) {
  const resolvedAdmin = await resolveAdmin(admin);
  const tenantJobWhere = buildJobTenantWhere(resolvedAdmin);

  const [totalJobs, activeJobs, featuredJobs, recentJobs] = await Promise.all([
    prisma.jobOpportunity.count({ where: tenantJobWhere }),
    prisma.jobOpportunity.count({ where: { isActive: true, ...tenantJobWhere } }),
    prisma.jobOpportunity.count({ where: { featured: true, ...tenantJobWhere } }),
    prisma.jobOpportunity.findMany({
      where: tenantJobWhere,
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        company: true,
        jobType: true,
        remoteOption: true,
        featured: true,
        isActive: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    totals: {
      totalJobs,
      activeJobs,
      inactiveJobs: totalJobs - activeJobs,
      featuredJobs,
    },
    recentJobs,
  };
}

export interface AdminAnalyticsOverview {
  overview: {
    totalUsers: number;
    totalStudents: number;
    totalTutors: number;
    totalAdmins: number;
    totalCourses: number;
    totalEnrollments: number;
    totalJobs: number;
    totalApplications: number;
    totalForumThreads: number;
    totalForumPosts: number;
    totalResumes: number;
  };
  metrics: {
    completionRate: number;
    placementRate: number;
    recentEnrollments: number;
    recentApplications: number;
  };
  topCourses: Array<{
    id: string;
    title: string;
    category?: string | null;
    _count?: {
      enrollments?: number | null;
    } | null;
  }>;
  recentUsers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
    createdAt: Date;
  }>;
  courseCompletionStats: Array<{
    status: string;
    _count?: {
      status?: number;
    };
  }>;
  jobPlacementStats: Array<{
    status: JobApplicationStatus;
    _count?: {
      status?: number;
    };
  }>;
  userGrowthStats: Array<{
    date: string;
    users: number;
  }>;
}

export async function getAnalyticsOverview(admin?: AdminUserWithTenant): Promise<AdminAnalyticsOverview> {
  const resolvedAdmin = await resolveAdmin(admin);
  const tenantUserWhere = buildUserTenantWhere(resolvedAdmin);
  const tenantJobWhere = buildJobTenantWhere(resolvedAdmin);
  const tenantId = getTenantContext(resolvedAdmin);

  const totalStudents = await prisma.user.count({ where: { role: 'STUDENT', ...tenantUserWhere } });
  const totalTutors = await prisma.user.count({ where: { role: 'TUTOR', ...tenantUserWhere } });
  const totalJobs = await prisma.jobOpportunity.count({ where: tenantJobWhere });
  const totalApplications = await prisma.jobApplication.count({
    where: tenantId ? { user: { tenantId } } : {},
  });

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
  } satisfies AdminAnalyticsOverview;
}

interface CreateJobInput {
  title: string;
  company: string;
  location: string;
  country: string;
  jobType: JobType;
  remoteOption: RemoteOption;
}

export async function createJobPosting(input: CreateJobInput, admin?: AdminUserWithTenant) {
  const resolvedAdmin = await resolveAdmin(admin);

  return prisma.jobOpportunity.create({
    data: {
      title: input.title,
      company: input.company,
      location: input.location,
      country: input.country,
      jobType: input.jobType,
      remoteOption: input.remoteOption,
      description: '',
      requirements: [],
      tags: [],
      featured: false,
      isActive: true,
      postedById: resolvedAdmin.id,
    },
  });
}
