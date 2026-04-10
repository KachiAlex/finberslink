import { Button } from "@/components/ui/button";
import { BarChart3, BookOpen, PenSquare, Users, Plus } from "lucide-react";
import { prisma } from "../../lib/prisma";
import Link from "next/link";
import { requireSession } from "../../lib/auth/session";
import { TutorDashboardClient } from "./tutor-dashboard-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TutorPage() {
  const session = await requireSession({
    allowedRoles: ["TUTOR"],
    requireTenant: true,
    failureMode: "error",
  });

  let coursesCount = 0;
  let enrollmentsCount = 0;
  let lessonsCount = 0;

  // Do not crash the tutor page if production DB schema/data is temporarily inconsistent.
  try {
    const [courses, enrollments, lessons] = await Promise.all([
      prisma.course.count({ where: { instructorId: session.sub } }),
      prisma.enrollment.count({ where: { course: { instructorId: session.sub } } }),
      prisma.courseLesson.count({ where: { course: { instructorId: session.sub } } }),
    ]);

    coursesCount = courses;
    enrollmentsCount = enrollments;
    lessonsCount = lessons;
  } catch (error) {
    console.error("Tutor stats query failed:", error);
  }

  return (
    <TutorDashboardClient 
      coursesCount={coursesCount}
      enrollmentsCount={enrollmentsCount}
      lessonsCount={lessonsCount}
    />
  );
}
