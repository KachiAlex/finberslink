import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "../../../../../components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { getLearnerLesson } from "../../../../../features/lms/data/course-service";
import { requireSession } from "../../../../../lib/auth/session";
import LessonPageClient from "./lesson-client";

const forumPreview = [
  {
    id: "thread-1",
    author: "Amina Yusuf",
    timeAgo: "2h",
    excerpt:
      "Loved the discovery canvas! Does anyone have tips for turning our interview notes into insight statements?",
  },
  {
    id: "thread-2",
    author: "Leo Martinez",
    timeAgo: "5h",
    excerpt: "Sharing my sprint retrospective template—open to feedback before the live review session tomorrow!",
  },
];

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const session = await requireSession({ allowedRoles: ["STUDENT"], failureMode: "redirect" });
  
  let result;
  try {
    result = await getLearnerLesson(courseId, lessonId, session.sub);
  } catch (error) {
    console.error("[lesson-detail] failed to fetch lesson:", error);
    notFound();
  }
  
  if (!result) {
    notFound();
  }

  const { course, lesson } = result;
  const nextLesson = course.lessons.find((item) => item.status === "available" && item.id !== lesson.id);

  return <LessonPageClient 
    course={course} 
    lesson={lesson} 
    nextLesson={nextLesson}
  />;
}
