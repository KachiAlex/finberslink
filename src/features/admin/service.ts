import { prisma } from "@/lib/prisma";

export async function requireAdminUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    throw new Error("Admin access required");
  }
  
  return user;
}

export async function archiveCourse(courseId: string) {
  return prisma.course.update({
    where: { id: courseId },
    data: { archived: true },
  });
}

export async function restoreCourse(courseId: string) {
  return prisma.course.update({
    where: { id: courseId },
    data: { archived: false },
  });
}

export async function approveCourseEdit(courseId: string) {
  return prisma.course.update({
    where: { id: courseId },
    data: { status: "APPROVED" },
  });
}

export async function rejectCourseEdit(courseId: string) {
  return prisma.course.update({
    where: { id: courseId },
    data: { status: "REJECTED" },
  });
}


export async function assignCourseToStudent(courseId: string, studentId: string) {
  return prisma.courseAssignment.create({
    data: { courseId, studentId },
  });
}

export async function assignCourseToStudentsBulk(courseId: string, studentIds: string[]) {
  return prisma.courseAssignment.createMany({
    data: studentIds.map(studentId => ({ courseId, studentId })),
  });
}

export async function updateStudentStatus(studentId: string, status: string) {
  return prisma.user.update({
    where: { id: studentId },
    data: { status },
  });
}

export async function updateUserRole(userId: string, role: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
  });
}

export async function updateUserStatus(userId: string, status: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { status },
  });
}

export async function createTenantInvite(tenantId: string, email: string) {
  return prisma.tenantInvite.create({
    data: { tenantId, email },
  });
}

export async function listAllUsers() {
  return prisma.user.findMany();
}

export async function listAssignableCourses() {
  return prisma.course.findMany({
    where: { archived: false },
  });
}

export async function listRecentCourseAssignmentEvents() {
  return prisma.courseAssignmentEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function listStudentAssignedCourses(studentId: string) {
  return prisma.courseAssignment.findMany({
    where: { studentId },
    include: { course: true },
  });
}

export async function unassignCourseFromStudent(courseId: string, studentId: string) {
  return prisma.courseAssignment.deleteMany({
    where: { courseId, studentId },
  });
}

export async function getCompanies() {
  return prisma.company.findMany();
}

export async function getTenantAdminDashboard(tenantId: string) {
  const users = await prisma.user.count({ where: { tenantId } });
  const courses = await prisma.course.count({ where: { tenantId } });
  const enrollments = await prisma.enrollment.count();
  
  return {
    totalUsers: users,
    totalCourses: courses,
    totalEnrollments: enrollments,
  };
}

export async function getSystemSnapshot() {
  const totalUsers = await prisma.user.count();
  const totalCourses = await prisma.course.count();
  const totalEnrollments = await prisma.enrollment.count();
  
  return {
    totalUsers,
    totalCourses,
    totalEnrollments,
    timestamp: new Date(),
  };
}

export async function getJobManagementSnapshot() {
  const totalJobs = await prisma.jobOpportunity.count();
  const totalApplications = await prisma.jobApplication.count();
  
  return {
    totalJobs,
    totalApplications,
  };
}

export async function getTutorManagementSnapshot() {
  const totalTutors = await prisma.user.count({ where: { role: "TUTOR" } });
  const activeCourses = await prisma.course.count({ where: { status: "ACTIVE" } });
  
  return {
    totalTutors,
    activeCourses,
  };
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
  });
}

export async function listAdminCourses() {
  const courses = await prisma.course.findMany({
    include: {
      instructor: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  });
  
  return {
    allCourses: courses,
  };
}

export async function listStudents() {
  return prisma.user.findMany({
    where: { role: "STUDENT" },
  });
}

export async function listTutors() {
  return prisma.user.findMany({
    where: { role: "TUTOR" },
  });
}

export async function getInviteByToken(token: string) {
  return prisma.tenantInvite.findUnique({
    where: { token },
    include: { tenant: true },
  });
}

export async function markInviteStatus(inviteId: string, status: string) {
  return prisma.tenantInvite.update({
    where: { id: inviteId },
    data: { status },
  });
}

export async function toggleFeatureFlag(key: string, enabled: boolean) {
  return prisma.featureFlag.upsert({
    where: { key },
    update: { enabled },
    create: { key, enabled },
  });
}

export async function listTenantInvites(tenantId: string) {
  return prisma.tenantInvite.findMany({
    where: { tenantId },
  });
}

export async function listAllJobs() {
  return prisma.jobOpportunity.findMany();
}

export async function updateJobPostingStatus(jobId: string, status: string) {
  return prisma.jobOpportunity.update({
    where: { id: jobId },
    data: { status },
  });
}

export async function getAnalyticsOverview() {
  const totalUsers = await prisma.user.count();
  const totalCourses = await prisma.course.count();
  const totalEnrollments = await prisma.enrollment.count();
  
  return {
    totalUsers,
    totalCourses,
    totalEnrollments,
  };
}

export async function listCoursesWithPendingEdits() {
  return prisma.course.findMany({
    where: { status: "PENDING" },
  });
}

export async function createJobPosting(data: {
  title: string;
  description: string;
  companyId?: string;
  location?: string;
  salary?: string;
  type?: string;
}) {
  return prisma.jobOpportunity.create({
    data: {
      title: data.title,
      description: data.description,
      location: data.location,
      salary: data.salary,
      type: data.type,
    },
  });
}
