import { notFound } from "next/navigation";

import { SiteHeader } from "../../../../components/layout/site-header";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { CourseHero } from "../../../../features/lms/components/course-hero";
import { LessonList } from "../../../../features/lms/components/lesson-list";
import { getCourse, getLearnerCourseDetail } from "../../../../features/lms/data/course-service";
import { requireSession } from "../../../../lib/auth/session";
import { Star, Users, Clock, CheckCircle2, BookOpen, MessageCircle, Download, Share2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CourseDetailPageOptimized(props: any) {
  const { courseId } = props.params as { courseId: string };
  
  // Try to get session but don't force redirect
  let session = null;
  try {
    session = await requireSession({ allowedRoles: ["STUDENT"], failureMode: "error" });
  } catch (error) {
    console.log("[course-detail-optimized] Session check failed:", error);
    // Don't redirect, just continue without session
  }
  
  let course;
  try {
    // Use session if available, otherwise use demo student
    course = await getLearnerCourseDetail(courseId, session?.sub);
  } catch (error) {
    console.error("[course-detail-optimized] failed to fetch course:", error);
    notFound();
  }

  if (!course) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <SiteHeader />
      <main className="relative">
        <CourseHero course={course} />
        
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              <Card className="border-border/50 bg-background/80 backdrop-blur-md">
                <CardContent className="p-6">
                  <h2 className="mb-4 text-2xl font-bold text-foreground">About this course</h2>
                  <p className="text-muted-foreground leading-relaxed">{course.description}</p>
                </CardContent>
              </Card>

              {course.outcomes && course.outcomes.length > 0 && (
                <Card className="border-border/50 bg-background/80 backdrop-blur-md">
                  <CardContent className="p-6">
                    <h3 className="mb-4 text-xl font-semibold text-foreground">Learning Outcomes</h3>
                    <ul className="space-y-2">
                      {course.outcomes.map((outcome, index) => (
                        <li key={index} className="flex items-start gap-3 text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                          {outcome}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <LessonList courseId={courseId} lessons={course.lessons} />
            </div>

            <div className="space-y-6">
              <Card className="border-border/50 bg-background/80 backdrop-blur-md">
                <CardContent className="p-6">
                  <div className="mb-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Duration</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{course.lessonsCount} lessons</p>
                  </div>

                  <div className="mb-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Level</span>
                    </div>
                    <Badge variant="secondary" className="text-sm">
                      {course.level}
                    </Badge>
                  </div>

                  {session ? (
                    <div className="space-y-3">
                      <Button asChild className="w-full">
                        <Link href={`/courses/${courseId}/lessons/${course.lessons[0]?.id}`}>
                          Start Lesson
                        </Link>
                      </Button>
                      <p className="text-center text-sm text-muted-foreground">
                        You are logged in as {session.sub}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Button asChild className="w-full" variant="outline">
                        <Link href="/login">
                          Login to Access
                        </Link>
                      </Button>
                      <p className="text-center text-sm text-muted-foreground">
                        Login required to access this course
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {course.skills && course.skills.length > 0 && (
                <Card className="border-border/50 bg-background/80 backdrop-blur-md">
                  <CardContent className="p-6">
                    <h3 className="mb-4 text-lg font-semibold text-foreground">Skills you'll gain</h3>
                    <div className="flex flex-wrap gap-2">
                      {course.skills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
