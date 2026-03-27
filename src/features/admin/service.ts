// Removed import of randomBytes; using fallback token generator
import { Prisma } from "@prisma/client";
import type {
  CourseApprovalStatus,
  CourseLevel,
  InviteStatus,
  JobApplicationStatus,
  JobType,
  NotificationType,
  RemoteOption,
  Role,
  UserStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { createNotificationIfMissing } from "@/features/notifications/service";

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

type AdminUserWithTenant = Prisma.UserGetPayload<{}>;

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
        stats: { courses: 0, students: 0, jobs: 0, enrollments: 0, resumes: 0, jobApplications: 0 },
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
  const tenantCourseWhere = buildCourseTenantWhere(resolvedAdmin);

  const [courseCount, studentCount, jobCount, enrollmentCount, resumeCount, applicationCount, recentStudents, recentJobs] = await Promise.all([
    prisma.course.count({ where: { ...tenantCourseWhere, archivedAt: null } }),
    prisma.user.count({ where: { role: 'STUDENT', ...tenantUserWhere } }),
    prisma.jobOpportunity.count({ where: { isActive: true, ...tenantJobWhere } }),
    prisma.enrollment.count({ where: { user: tenantUserWhere } }),
    prisma.resume.count({ where: { user: tenantUserWhere } }),
    prisma.jobApplication.count({ where: { user: tenantUserWhere } }),
    prisma.user.findMany({ where: { role: 'STUDENT', ...tenantUserWhere }, take: 4, orderBy: { createdAt: 'desc' } }),
    prisma.jobOpportunity.findMany({ where: { isActive: true, ...tenantJobWhere }, take: 3, orderBy: { createdAt: 'desc' } }),
  ]);

  return {
    stats: {
      courses: courseCount,
      students: studentCount,
      jobs: jobCount,
      enrollments: enrollmentCount,
      resumes: resumeCount,
      jobApplications: applicationCount,
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
      archivedAt: null,
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
    where: { ...tenantCourseWhere, archivedAt: null },
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

export async function listArchivedCourses(admin?: AdminUserWithTenant) {
  const resolvedAdmin = await resolveAdmin(admin);
  const tenantCourseWhere = buildCourseTenantWhere(resolvedAdmin);

  return prisma.course.findMany({
    where: { ...tenantCourseWhere, archivedAt: { not: null } },
    take: 100,
    orderBy: { archivedAt: 'desc' },
    include: {
      instructor: {
        select: { id: true, firstName: true, lastName: true, email: true, role: true },
      },
      _count: { select: { enrollments: true } },
    },
  });
}

export async function listCoursesWithPendingEdits(admin?: AdminUserWithTenant) {
  const resolvedAdmin = await resolveAdmin(admin);
  const tenantCourseWhere = buildCourseTenantWhere(resolvedAdmin);

  return prisma.course.findMany({
    where: { ...tenantCourseWhere, hasPendingEdit: true, archivedAt: null },
    take: 100,
    orderBy: { updatedAt: 'desc' },
    include: {
      instructor: {
        select: { id: true, firstName: true, lastName: true, email: true, role: true },
      },
    },
  });
}

export async function archiveCourse(courseId: string, admin?: AdminUserWithTenant) {
  const resolvedAdmin = await resolveAdmin(admin);
  const tenantCourseWhere = buildCourseTenantWhere(resolvedAdmin);

  const course = await prisma.course.findFirst({
    where: { id: courseId, ...tenantCourseWhere, archivedAt: null },
    select: { id: true },
  });

  if (!course) {
    throw new Error('Course not found or already archived');
  }

  return prisma.course.update({
    where: { id: courseId },
    data: { archivedAt: new Date() },
  });
}

export async function restoreCourse(courseId: string, admin?: AdminUserWithTenant) {
  const resolvedAdmin = await resolveAdmin(admin);
  const tenantCourseWhere = buildCourseTenantWhere(resolvedAdmin);

  const course = await prisma.course.findFirst({
    where: { id: courseId, ...tenantCourseWhere, archivedAt: { not: null } },
    select: { id: true },
  });

  if (!course) {
    throw new Error('Course not found or not archived');
  }

  return prisma.course.update({
    where: { id: courseId },
    data: { archivedAt: null },
  });
}

export async function approveCourseEdit(courseId: string, admin?: AdminUserWithTenant) {
  const resolvedAdmin = await resolveAdmin(admin);
  const tenantCourseWhere = buildCourseTenantWhere(resolvedAdmin);

  const course = await prisma.course.findFirst({
    where: { id: courseId, ...tenantCourseWhere, hasPendingEdit: true },
  });

  if (!course) {
    throw new Error('Course not found or no pending edit');
  }

  const edit = course.pendingEdit as Record<string, unknown> | null;
  if (!edit) {
    throw new Error('No pending edit data found');
  }

  return prisma.course.update({
    where: { id: courseId },
    data: {
      title: typeof edit.title === 'string' ? edit.title : undefined,
      tagline: typeof edit.tagline === 'string' ? edit.tagline : undefined,
      description: typeof edit.description === 'string' ? edit.description : undefined,
      category: typeof edit.category === 'string' ? edit.category : undefined,
      level: typeof edit.level === 'string' ? (edit.level as CourseLevel) : undefined,
      coverImage: typeof edit.coverImage === 'string' ? edit.coverImage : undefined,
      outcomes: Array.isArray(edit.outcomes) ? (edit.outcomes as string[]) : undefined,
      skills: Array.isArray(edit.skills) ? (edit.skills as string[]) : undefined,
      pendingEdit: Prisma.DbNull,
      hasPendingEdit: false,
    },
  });
}

export async function rejectCourseEdit(courseId: string, admin?: AdminUserWithTenant) {
  const resolvedAdmin = await resolveAdmin(admin);
  const tenantCourseWhere = buildCourseTenantWhere(resolvedAdmin);

  const course = await prisma.course.findFirst({
    where: { id: courseId, ...tenantCourseWhere, hasPendingEdit: true },
    select: { id: true },
  });

  if (!course) {
    throw new Error('Course not found or no pending edit');
  }

  return prisma.course.update({
    where: { id: courseId },
    data: { pendingEdit: Prisma.DbNull, hasPendingEdit: false },
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

export async function listAssignableCourses(admin?: AdminUserWithTenant) {
  const resolvedAdmin = await resolveAdmin(admin);
  const tenantCourseWhere = buildCourseTenantWhere(resolvedAdmin);

  const courses = await prisma.course.findMany({
    where: {
      ...tenantCourseWhere,
      approvalStatus: 'APPROVED',
      archivedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      level: true,
      category: true,
    },
  });

  const deduped = new Map<string, {
    id: string;
    title: string;
    level: CourseLevel;
    category: string;
  }>();

  for (const course of courses) {
    const key = (course.slug || course.title).trim().toLowerCase();
    if (!deduped.has(key)) {
      deduped.set(key, {
        id: course.id,
        title: course.title,
        level: course.level,
        category: course.category,
      });
    }
  }

  return Array.from(deduped.values()).sort((a, b) => a.title.localeCompare(b.title));
}

async function isCourseAssignmentTableAvailable() {
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ table_name: string | null }>>(
      `SELECT to_regclass('public."CourseAssignment"') AS table_name`,
    );
    return Boolean(rows[0]?.table_name);
  } catch {
    return false;
  }
}

function isCourseAssignmentMissingError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
    return true;
  }

  if (error instanceof Error) {
    return error.message.includes('CourseAssignment') && error.message.includes('does not exist');
  }

  return false;
}

export async function assignCourseToStudent(
  input: {
    studentId: string;
    courseId: string;
    notes?: string;
  },
  admin?: AdminUserWithTenant,
) {
  const resolvedAdmin = await resolveAdmin(admin);
  const tenantStudentWhere = buildUserTenantWhere(resolvedAdmin);
  const tenantCourseWhere = buildCourseTenantWhere(resolvedAdmin);

  const student = await prisma.user.findFirst({
    where: {
      id: input.studentId,
      role: 'STUDENT',
      ...tenantStudentWhere,
    },
    select: { id: true, firstName: true, lastName: true },
  });

  if (!student) {
    throw new Error('Student not found in your tenant');
  }

  const course = await prisma.course.findFirst({
    where: {
      id: input.courseId,
      approvalStatus: 'APPROVED',
      ...tenantCourseWhere,
    },
    select: { id: true, title: true },
  });

  if (!course) {
    throw new Error('Course not found, not approved, or outside your tenant');
  }

  const upsertEnrollmentWithoutUnique = async (
    db: Pick<typeof prisma, 'enrollment'>,
    userId: string,
    courseId: string,
  ) => {
    const existingEnrollment = await db.enrollment.findFirst({
      where: { userId, courseId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (existingEnrollment) {
      return db.enrollment.update({
        where: { id: existingEnrollment.id },
        data: { status: 'ACTIVE' },
      });
    }

    return db.enrollment.create({
      data: {
        userId,
        courseId,
        status: 'ACTIVE',
      },
    });
  };

  const tableAvailable = await isCourseAssignmentTableAvailable();

  if (!tableAvailable) {
    const enrollment = await upsertEnrollmentWithoutUnique(prisma, input.studentId, input.courseId);

    const studentName = `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim() || "you";
    const actionUrl = `/dashboard/courses`;

    await createNotificationIfMissing({
      userId: student.id,
      type: "ENROLLMENT_UPDATE" as NotificationType,
      title: `New course assigned: ${course.title}`,
      body: `An admin assigned ${course.title} to ${studentName}.`,
      actionUrl,
      dedupeWindowHours: 72,
    });

    return { enrollment, assignment: null };
  }

  const result = await prisma.$transaction(async (tx) => {
    const enrollment = await upsertEnrollmentWithoutUnique(tx, input.studentId, input.courseId);

    const existingAssignment = await tx.courseAssignment.findFirst({
      where: {
        studentId: input.studentId,
        courseId: input.courseId,
        status: {
          in: ['PENDING', 'ACCEPTED'],
        },
      },
      orderBy: { assignedAt: 'desc' },
      select: { id: true },
    });

    const assignment = existingAssignment
      ? await tx.courseAssignment.update({
          where: { id: existingAssignment.id },
          data: {
            assignedById: resolvedAdmin.id,
            status: 'ACCEPTED',
            acceptedAt: new Date(),
            declinedAt: null,
            revokedAt: null,
            notes: input.notes?.trim() || null,
          },
        })
      : await tx.courseAssignment.create({
          data: {
            courseId: input.courseId,
            studentId: input.studentId,
            assignedById: resolvedAdmin.id,
            status: 'ACCEPTED',
            acceptedAt: new Date(),
            notes: input.notes?.trim() || null,
          },
        });

    return { enrollment, assignment };
  });

  const studentName = `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim() || "you";
  const actionUrl = `/dashboard/courses`;

  await createNotificationIfMissing({
    userId: student.id,
    type: "ENROLLMENT_UPDATE" as NotificationType,
    title: `New course assigned: ${course.title}`,
    body: `An admin assigned ${course.title} to ${studentName}.`,
    actionUrl,
    dedupeWindowHours: 72,
  });

  return result;
}

export async function unassignCourseFromStudent(
  input: {
    studentId: string;
    courseId: string;
    notes?: string;
  },
  admin?: AdminUserWithTenant,
) {
  const resolvedAdmin = await resolveAdmin(admin);
  const tenantStudentWhere = buildUserTenantWhere(resolvedAdmin);
  const tenantCourseWhere = buildCourseTenantWhere(resolvedAdmin);

  const student = await prisma.user.findFirst({
    where: {
      id: input.studentId,
      role: 'STUDENT',
      ...tenantStudentWhere,
    },
    select: { id: true },
  });

  if (!student) {
    throw new Error('Student not found in your tenant');
  }

  const course = await prisma.course.findFirst({
    where: {
      id: input.courseId,
      ...tenantCourseWhere,
    },
    select: { id: true },
  });

  if (!course) {
    throw new Error('Course not found in your tenant');
  }

  const tableAvailable = await isCourseAssignmentTableAvailable();

  const result = await prisma.$transaction(async (tx) => {
    const enrollment = await tx.enrollment.findFirst({
      where: {
        userId: input.studentId,
        courseId: input.courseId,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (!enrollment) {
      throw new Error('No active assignment found for this student and course');
    }

    const updatedEnrollment = await tx.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: 'WITHDRAWN',
        updatedAt: new Date(),
      },
    });

    if (!tableAvailable) {
      return { enrollment: updatedEnrollment, assignment: null };
    }

    const assignment = await tx.courseAssignment.findFirst({
      where: {
        studentId: input.studentId,
        courseId: input.courseId,
        status: {
          in: ['PENDING', 'ACCEPTED'],
        },
      },
      orderBy: { assignedAt: 'desc' },
      select: { id: true },
    });

    if (!assignment) {
      return { enrollment: updatedEnrollment, assignment: null };
    }

    const updatedAssignment = await tx.courseAssignment.update({
      where: { id: assignment.id },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        notes: input.notes?.trim() || 'Unassigned by admin',
      },
    });

    return { enrollment: updatedEnrollment, assignment: updatedAssignment };
  });

  return result;
}

export async function listRecentCourseAssignmentEvents(admin?: AdminUserWithTenant) {
  const resolvedAdmin = await resolveAdmin(admin);
  const tenantCourseWhere = buildCourseTenantWhere(resolvedAdmin);
  const tenantStudentWhere = buildUserTenantWhere(resolvedAdmin);
  const fallbackAssignedByName = `${resolvedAdmin.firstName ?? ""} ${resolvedAdmin.lastName ?? ""}`.trim() || 'Admin';
  const fallbackAssignedByEmail = resolvedAdmin.email;

  const enrollmentFallbackEvents = async () => {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        status: { in: ['ACTIVE', 'WITHDRAWN'] },
        course: tenantCourseWhere,
        user: tenantStudentWhere,
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        status: true,
        course: { select: { title: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    return enrollments.map((item) => ({
      id: `enrollment-${item.id}`,
      status: item.status === 'WITHDRAWN' ? 'REVOKED' : 'ACCEPTED',
      assignedAt: item.status === 'WITHDRAWN' ? item.updatedAt : item.createdAt,
      acceptedAt: item.status === 'WITHDRAWN' ? null : item.createdAt,
      declinedAt: null,
      revokedAt: item.status === 'WITHDRAWN' ? item.updatedAt : null,
      notes: item.status === 'WITHDRAWN' ? 'Unassigned by admin' : 'Assigned by admin',
      courseTitle: item.course.title,
      studentName: `${item.user.firstName ?? ""} ${item.user.lastName ?? ""}`.trim(),
      studentEmail: item.user.email,
      assignedByName: fallbackAssignedByName,
      assignedByEmail: fallbackAssignedByEmail,
    }));
  };

  const tableAvailable = await isCourseAssignmentTableAvailable();
  if (!tableAvailable) {
    return enrollmentFallbackEvents();
  }

  let assignments;
  try {
    assignments = await prisma.courseAssignment.findMany({
      where: {
        course: tenantCourseWhere,
        student: tenantStudentWhere,
      },
      orderBy: { assignedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        status: true,
        assignedAt: true,
        acceptedAt: true,
        declinedAt: true,
        revokedAt: true,
        notes: true,
        course: { select: { id: true, title: true } },
        student: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  } catch (error) {
    if (isCourseAssignmentMissingError(error)) {
      // Allow admin pages to render even if assignment table migration is pending.
      return enrollmentFallbackEvents();
    }
    throw error;
  }

  const assignmentEvents = assignments.map((item) => ({
    id: item.id,
    status: item.status,
    assignedAt: item.assignedAt,
    acceptedAt: item.acceptedAt,
    declinedAt: item.declinedAt,
    revokedAt: item.revokedAt,
    notes: item.notes,
    courseTitle: item.course.title,
    studentName: `${item.student.firstName ?? ""} ${item.student.lastName ?? ""}`.trim(),
    studentEmail: item.student.email,
    assignedByName: `${item.assignedBy.firstName ?? ""} ${item.assignedBy.lastName ?? ""}`.trim(),
    assignedByEmail: item.assignedBy.email,
  }));

  if (assignmentEvents.length > 0) {
    return assignmentEvents;
  }

  return enrollmentFallbackEvents();
}

export async function assignCourseToStudentsBulk(
  input: {
    studentIds: string[];
    courseId: string;
    notes?: string;
  },
  admin?: AdminUserWithTenant,
) {
  const resolvedAdmin = await resolveAdmin(admin);
  const uniqueStudentIds = Array.from(new Set(input.studentIds.map((id) => id.trim()).filter(Boolean)));

  if (uniqueStudentIds.length === 0) {
    throw new Error('Select at least one student');
  }

  let assigned = 0;
  for (const studentId of uniqueStudentIds) {
    await assignCourseToStudent(
      {
        studentId,
        courseId: input.courseId,
        notes: input.notes,
      },
      resolvedAdmin,
    );
    assigned += 1;
  }

  return { assigned };
}

export async function listStudentAssignedCourseIds(
  studentIds: string[],
  admin?: AdminUserWithTenant,
) {
  const resolvedAdmin = await resolveAdmin(admin);
  const tenantStudentWhere = buildUserTenantWhere(resolvedAdmin);
  const ids = Array.from(new Set(studentIds.map((id) => id.trim()).filter(Boolean)));

  if (ids.length === 0) {
    return {} as Record<string, string[]>;
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: { in: ids },
      status: 'ACTIVE',
      user: tenantStudentWhere,
    },
    select: {
      userId: true,
      courseId: true,
    },
  });

  const assignmentMap: Record<string, string[]> = {};
  const seenPerStudent: Record<string, Set<string>> = {};
  for (const enrollment of enrollments) {
    if (!assignmentMap[enrollment.userId]) {
      assignmentMap[enrollment.userId] = [];
      seenPerStudent[enrollment.userId] = new Set<string>();
    }
    if (!seenPerStudent[enrollment.userId].has(enrollment.courseId)) {
      assignmentMap[enrollment.userId].push(enrollment.courseId);
      seenPerStudent[enrollment.userId].add(enrollment.courseId);
    }
  }

  return assignmentMap;
}

export async function listStudentAssignedCourses(
  studentIds: string[],
  admin?: AdminUserWithTenant,
) {
  const resolvedAdmin = await resolveAdmin(admin);
  const tenantStudentWhere = buildUserTenantWhere(resolvedAdmin);
  const ids = Array.from(new Set(studentIds.map((id) => id.trim()).filter(Boolean)));

  if (ids.length === 0) {
    return {} as Record<string, Array<{ courseId: string; title: string; level: CourseLevel; category: string; assignedAt: Date }>>;
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: { in: ids },
      status: 'ACTIVE',
      user: tenantStudentWhere,
    },
    orderBy: { createdAt: 'desc' },
    select: {
      userId: true,
      createdAt: true,
      course: {
        select: {
          id: true,
          title: true,
          level: true,
          category: true,
        },
      },
    },
  });

  const assignmentMap: Record<string, Array<{ courseId: string; title: string; level: CourseLevel; category: string; assignedAt: Date }>> = {};
  const seenPerStudent: Record<string, Set<string>> = {};

  for (const enrollment of enrollments) {
    if (!assignmentMap[enrollment.userId]) {
      assignmentMap[enrollment.userId] = [];
      seenPerStudent[enrollment.userId] = new Set<string>();
    }

    if (!seenPerStudent[enrollment.userId].has(enrollment.course.id)) {
      assignmentMap[enrollment.userId].push({
        courseId: enrollment.course.id,
        title: enrollment.course.title,
        level: enrollment.course.level,
        category: enrollment.course.category,
        assignedAt: enrollment.createdAt,
      });
      seenPerStudent[enrollment.userId].add(enrollment.course.id);
    }
  }

  return assignmentMap;
}

export async function listStudents(admin?: AdminUserWithTenant) {
  const resolvedAdmin = await resolveAdmin(admin);
  const tenantWhere = buildUserTenantWhere(resolvedAdmin);

  const students = await prisma.user.findMany({
    where: { role: 'STUDENT', ...tenantWhere },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const seen = new Set<string>();
  return students.filter((student) => {
    const key = student.email ? student.email.toLowerCase() : student.id;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
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
      enrollments: {
        select: {
          id: true,
          createdAt: true,
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
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

// Tutor Approval Management Functions

export async function approveTutor(tutorId: string, notes?: string, admin?: AdminUserWithTenant) {
  const resolvedAdmin = await resolveAdmin(admin);
  
  // Verify tutor exists
  const tutor = await prisma.user.findUnique({
    where: { id: tutorId },
  });

  if (!tutor || tutor.role !== 'TUTOR') {
    throw new Error('Tutor not found');
  }

  return prisma.tutorApproval.upsert({
    where: { tutorId },
    create: {
      tutorId,
      approvedBy: resolvedAdmin.id,
      status: 'APPROVED' as any,
      notes: notes || null,
      approvedAt: new Date(),
    },
    update: {
      status: 'APPROVED' as any,
      notes: notes || null,
      approvedAt: new Date(),
      approvedBy: resolvedAdmin.id,
    },
  });
}

export async function rejectTutor(tutorId: string, notes?: string, admin?: AdminUserWithTenant) {
  const resolvedAdmin = await resolveAdmin(admin);
  
  // Verify tutor exists
  const tutor = await prisma.user.findUnique({
    where: { id: tutorId },
  });

  if (!tutor || tutor.role !== 'TUTOR') {
    throw new Error('Tutor not found');
  }

  return prisma.tutorApproval.upsert({
    where: { tutorId },
    create: {
      tutorId,
      approvedBy: resolvedAdmin.id,
      status: 'REJECTED' as any,
      notes: notes || null,
    },
    update: {
      status: 'REJECTED' as any,
      notes: notes || null,
      approvedBy: resolvedAdmin.id,
    },
  });
}

export async function suspendTutor(tutorId: string, notes?: string, admin?: AdminUserWithTenant) {
  const resolvedAdmin = await resolveAdmin(admin);
  
  // Verify tutor exists
  const tutor = await prisma.user.findUnique({
    where: { id: tutorId },
  });

  if (!tutor || tutor.role !== 'TUTOR') {
    throw new Error('Tutor not found');
  }

  return prisma.tutorApproval.upsert({
    where: { tutorId },
    create: {
      tutorId,
      approvedBy: resolvedAdmin.id,
      status: 'SUSPENDED' as any,
      notes: notes || null,
    },
    update: {
      status: 'SUSPENDED' as any,
      notes: notes || null,
      approvedBy: resolvedAdmin.id,
    },
  });
}

export async function getTutorApprovalStatus(tutorId: string) {
  const tutor = await prisma.user.findUnique({
    where: { id: tutorId },
    include: {
      tutorApprovalAsStudent: {
        select: {
          id: true,
          status: true,
          notes: true,
          approvedAt: true,
          createdAt: true,
          updatedAt: true,
          admin: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!tutor || tutor.role !== 'TUTOR') {
    throw new Error('Tutor not found');
  }

  return {
    tutorId: tutor.id,
    name: `${tutor.firstName} ${tutor.lastName}`,
    email: tutor.email,
    approvalStatus: tutor.tutorApprovalAsStudent?.[0]?.status ?? 'PENDING',
    approvalDetails: tutor.tutorApprovalAsStudent,
  };
}

export async function listTutorApprovals(filter?: {
  status?: string;
  page?: number;
  limit?: number;
}, admin?: AdminUserWithTenant) {
  const resolvedAdmin = await resolveAdmin(admin);
  const page = Math.max(filter?.page ?? 1, 1);
  const limit = filter?.limit ?? 20;

  const whereApproval: any = {};
  if (filter?.status) {
    whereApproval.status = filter.status;
  }

  const [total, approvals] = await Promise.all([
    prisma.tutorApproval.count({ where: whereApproval }),
    prisma.tutorApproval.findMany({
      where: whereApproval,
      include: {
        tutor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    approvals,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
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
