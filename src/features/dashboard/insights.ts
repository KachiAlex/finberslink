import { prisma } from "@/lib/prisma";

export async function getDashboardInsights(userId: string) {
  const enrollments = await prisma.enrollment.count({ where: { userId } });
  const resumes = await prisma.resume.count({ where: { userId } });
  const applications = await prisma.jobApplication.count({ where: { userId } });

  return {
    enrollments,
    resumes,
    applications,
  };
}

export async function getUserActivityFeed(userId: string) {
  return [];
}

export async function invalidateDashboardInsights(userId: string) {
  return true;
}

export async function getAdminDashboardInsights(adminId: string) {
  const totalUsers = await prisma.user.count();
  const totalCourses = await prisma.course.count();
  const totalEnrollments = await prisma.enrollment.count();
  
  return {
    totalUsers,
    totalCourses,
    totalEnrollments,
  };
}

export async function getEmployerDashboardInsights(employerId: string) {
  const totalJobs = await prisma.jobOpportunity.count({ where: { createdBy: employerId } });
  const totalApplications = await prisma.jobApplication.count();
  
  return {
    totalJobs,
    totalApplications,
  };
}

export async function getStudentDashboardInsights(studentId: string) {
  const enrollments = await prisma.enrollment.count({ where: { userId: studentId } });
  const resumes = await prisma.resume.count({ where: { userId: studentId } });
  const applications = await prisma.jobApplication.count({ where: { userId: studentId } });
  
  return {
    enrollments,
    resumes,
    applications,
  };
}

export async function getTutorDashboardInsights(tutorId: string) {
  const courses = await prisma.course.count({ where: { instructorId: tutorId } });
  const students = await prisma.enrollment.count({ where: { course: { instructorId: tutorId } } });
  
  return {
    courses,
    students,
  };
}
