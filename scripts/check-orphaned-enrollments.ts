import { prisma } from "@/lib/prisma";

async function main() {
  const enrollments = await prisma.enrollment.findMany({
    select: {
      id: true,
      userId: true,
      courseId: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const uniqueCourseIds = Array.from(new Set(enrollments.map((enrollment) => enrollment.courseId)));
  const courses = await prisma.course.findMany({
    where: { id: { in: uniqueCourseIds } },
    select: { id: true, title: true },
  });

  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const orphaned = enrollments.filter((enrollment) => !courseMap.has(enrollment.courseId));

  console.log(`Total enrollments: ${enrollments.length}`);
  console.log(`Unique course ids referenced: ${uniqueCourseIds.length}`);
  console.log(`Orphaned enrollments: ${orphaned.length}`);

  if (orphaned.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(new Set(orphaned.map((enrollment) => enrollment.userId))) } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    const userMap = new Map(users.map((user) => [user.id, user]));
    console.table(
      orphaned.map((enrollment) => {
        const user = userMap.get(enrollment.userId);
        return {
          enrollmentId: enrollment.id,
          studentId: enrollment.userId,
          studentEmail: user?.email ?? "unknown",
          studentName: `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "unknown",
          courseId: enrollment.courseId,
          status: enrollment.status,
          createdAt: enrollment.createdAt.toISOString(),
          updatedAt: enrollment.updatedAt.toISOString(),
        };
      })
    );
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Failed to inspect orphaned enrollments", error);
  prisma.$disconnect();
  process.exit(1);
});