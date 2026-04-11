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
