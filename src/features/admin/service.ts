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

export const listCourses = listAdminCourses;
export const createCourse = createAdminCourse;

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

export async function listAllUsers(filters?: {
  role?: Role;
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const { role, status, search, page = 1, limit = 20 } = filters || {};
  const skip = (page - 1) * limit;

  const where: any = {};
  
  if (role) where.role = role;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
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
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function updateUserRole(userId: string, role: Role) {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
    include: {
      profile: true,
    },
  });
}

export async function updateUserStatus(userId: string, status: UserStatus) {
  return prisma.user.update({
    where: { id: userId },
    data: { status },
    include: {
      profile: true,
    },
  });
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      enrollments: {
        include: {
          course: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      jobApplications: {
        include: {
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
      _count: {
        select: {
          enrollments: true,
          jobApplications: true,
          forumThreads: true,
          forumPosts: true,
          resumes: true,
        },
      },
    },
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
      _count: {
        select: {
          applications: true,
        },
      },
    },
  });
}

export async function getAnalyticsOverview() {
  const [
    totalUsers,
    totalStudents,
    totalTutors,
    totalAdmins,
    totalCourses,
    totalEnrollments,
    totalJobs,
    totalApplications,
    totalForumThreads,
    totalForumPosts,
    totalResumes,
    recentEnrollments,
    recentApplications,
    courseCompletionStats,
    jobPlacementStats,
    userGrowthStats,
  ] = await Promise.all([
    // User counts
    prisma.user.count(),
    prisma.user.count({ where: { role: Role.STUDENT } }),
    prisma.user.count({ where: { role: Role.TUTOR } }),
    prisma.user.count({ where: { role: { in: [Role.ADMIN, Role.SUPER_ADMIN] } } }),
    
    // Content counts
    prisma.course.count(),
    prisma.enrollment.count(),
    prisma.jobOpportunity.count(),
    prisma.jobApplication.count(),
    prisma.forumThread.count(),
    prisma.forumPost.count(),
    prisma.resume.count(),
    
    // Recent activity (last 30 days)
    prisma.enrollment.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.jobApplication.count({
      where: {
        submittedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    
    // Course completion rates
    prisma.enrollment.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    }),
    
    // Job placement stats
    prisma.jobApplication.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    }),
    
    // User growth (last 6 months)
    prisma.user.groupBy({
      by: ["role"],
      where: {
        createdAt: {
          gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000),
        },
      },
      _count: {
        role: true,
      },
    }),
  ]);

  // Calculate completion rate
  const completedEnrollments = courseCompletionStats.find(s => s.status === "COMPLETED")?._count.status || 0;
  const totalEnrollmentsCount = courseCompletionStats.reduce((sum, s) => sum + s._count.status, 0);
  const completionRate = totalEnrollmentsCount > 0 ? (completedEnrollments / totalEnrollmentsCount) * 100 : 0;

  // Calculate placement rate
  const placedApplications = jobPlacementStats.find(s => s.status === "OFFER")?._count.status || 0;
  const totalApplicationsCount = jobPlacementStats.reduce((sum, s) => sum + s._count.status, 0);
  const placementRate = totalApplicationsCount > 0 ? (placedApplications / totalApplicationsCount) * 100 : 0;

  // Top performing courses
  const topCourses = await prisma.course.findMany({
    select: {
      id: true,
      title: true,
      category: true,
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
    orderBy: {
      enrollments: {
        _count: "desc",
      },
    },
    take: 5,
  });

  // Recent user activity
  const recentUsers = await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  return {
    overview: {
      totalUsers,
      totalStudents,
      totalTutors,
      totalAdmins,
      totalCourses,
      totalEnrollments,
      totalJobs,
      totalApplications,
      totalForumThreads,
      totalForumPosts,
      totalResumes,
    },
    metrics: {
      completionRate: Math.round(completionRate * 10) / 10,
      placementRate: Math.round(placementRate * 10) / 10,
      recentEnrollments,
      recentApplications,
    },
    topCourses,
    recentUsers,
    courseCompletionStats,
    jobPlacementStats,
    userGrowthStats,
  };
}

// Forum Moderation Functions
export async function getForumModerationData(filters?: {
  status?: "ACTIVE" | "HIDDEN" | "DELETED";
  reportStatus?: "PENDING" | "RESOLVED" | "DISMISSED";
  page?: number;
  limit?: number;
}) {
  const { status, reportStatus, page = 1, limit = 20 } = filters || {};
  const skip = (page - 1) * limit;

  const where: any = {};
  
  if (status) {
    where.status = status;
  }
  
  if (reportStatus) {
    where.reports = {
      some: {
        status: reportStatus,
      },
    };
  }

  const [threads, total] = await Promise.all([
    prisma.forumThread.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        posts: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            reports: {
              where: reportStatus ? { status: reportStatus } : undefined,
            },
          },
          orderBy: { createdAt: "desc" },
        },
        reports: {
          where: reportStatus ? { status: reportStatus } : undefined,
          include: {
            reportedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            posts: true,
            reports: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.forumThread.count({ where }),
  ]);

  return {
    threads,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function hideForumThread(threadId: string, reason: string) {
  return prisma.forumThread.update({
    where: { id: threadId },
    data: {
      status: "HIDDEN",
      moderationNote: reason,
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
}

export async function deleteForumThread(threadId: string, reason: string) {
  return prisma.forumThread.update({
    where: { id: threadId },
    data: {
      status: "DELETED",
      moderationNote: reason,
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
}

export async function restoreForumThread(threadId: string) {
  return prisma.forumThread.update({
    where: { id: threadId },
    data: {
      status: "ACTIVE",
      moderationNote: null,
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
}

export async function hideForumPost(postId: string, reason: string) {
  return prisma.forumPost.update({
    where: { id: postId },
    data: {
      status: "HIDDEN",
      moderationNote: reason,
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      thread: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
}

export async function deleteForumPost(postId: string, reason: string) {
  return prisma.forumPost.update({
    where: { id: postId },
    data: {
      status: "DELETED",
      moderationNote: reason,
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      thread: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
}

export async function restoreForumPost(postId: string) {
  return prisma.forumPost.update({
    where: { id: postId },
    data: {
      status: "ACTIVE",
      moderationNote: null,
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      thread: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
}

export async function getModerationStats() {
  const [
    totalThreads,
    activeThreads,
    hiddenThreads,
    deletedThreads,
    totalPosts,
    activePosts,
    hiddenPosts,
    deletedPosts,
    pendingReports,
    resolvedReports,
  ] = await Promise.all([
    prisma.forumThread.count(),
    prisma.forumThread.count({ where: { status: "ACTIVE" } }),
    prisma.forumThread.count({ where: { status: "HIDDEN" } }),
    prisma.forumThread.count({ where: { status: "DELETED" } }),
    prisma.forumPost.count(),
    prisma.forumPost.count({ where: { status: "ACTIVE" } }),
    prisma.forumPost.count({ where: { status: "HIDDEN" } }),
    prisma.forumPost.count({ where: { status: "DELETED" } }),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.report.count({ where: { status: "RESOLVED" } }),
  ]);

  return {
    threads: {
      total: totalThreads,
      active: activeThreads,
      hidden: hiddenThreads,
      deleted: deletedThreads,
    },
    posts: {
      total: totalPosts,
      active: activePosts,
      hidden: hiddenPosts,
      deleted: deletedPosts,
    },
    reports: {
      pending: pendingReports,
      resolved: resolvedReports,
    },
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
      postedById: DEFAULT_ADMIN_ID,
    },
  });
}
