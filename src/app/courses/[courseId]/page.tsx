import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CourseHero } from "@/features/lms/components/course-hero";
import { LessonList } from "@/features/lms/components/lesson-list";
import { getLearnerCourseDetail } from "@/features/lms/data/course-service";
import { requireSession } from "@/lib/auth/session";
import { Star, Users, Clock, CheckCircle2, BookOpen, MessageCircle, Download, Share2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CourseDetailPage({
  params,
}: {
  params: { courseId: string };
}) {
  const { courseId } = params;
  const session = await requireSession({ allowedRoles: ["STUDENT"], failureMode: "redirect" });
  const course = await getLearnerCourseDetail(courseId, session.sub);

  if (!course) {
    notFound();
  }

  const progressPercentage = course.lessonsCompleted ? Math.round((course.lessonsCompleted / course.lessonsCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <SiteHeader />
      
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Enhanced Course Hero */}
        <section className="relative rounded-xl overflow-hidden bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/20 p-8 mb-12">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-cyan-500/20 text-cyan-300 border-0">Featured Course</Badge>
                <div className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-medium">4.8 (324 reviews)</span>
                </div>
              </div>

              <h1 className="text-4xl font-bold text-white">
                {course.name || course.title}
              </h1>

              <p className="text-lg text-slate-300">
                {course.description}
              </p>

              <div className="flex gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-slate-300">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <span>{course.enrollmentCount || 0}+ students enrolled</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <span>8 weeks • {course.lessonsCount || 0} lessons</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button className="bg-cyan-600 hover:bg-cyan-700 text-white" asChild>
                  <Link href={`/courses/${course.id}/lessons/${course.lessons?.[0]?.id}`}>
                    Continue Learning <BookOpen className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button variant="outline" className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10">
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Progress Card */}
            <div className="rounded-lg bg-slate-800 border border-slate-700 p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-300">Your Progress</span>
                  <span className="text-2xl font-bold text-cyan-400">{progressPercentage}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-700">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 text-sm py-4 border-t border-b border-slate-700">
                <div className="flex justify-between text-slate-400">
                  <span>Lessons Completed</span>
                  <span className="text-white">{course.lessonsCompleted || 0}/{course.lessonsCount}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Time Invested</span>
                  <span className="text-white">12 hours</span>
                </div>
              </div>

              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={progressPercentage < 100}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Claim Certificate
              </Button>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3 mb-12">
          {/* Left Column - Course Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Overview Card */}
            <Card className="border border-slate-700 bg-slate-800/50">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-3">Course Overview</h2>
                  <p className="text-slate-300">{course.description}</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <h3 className="text-xs uppercase tracking-[0.3em] font-semibold text-cyan-400">What You'll Learn</h3>
                    <ul className="space-y-2">
                      {course.outcomes?.slice(0, 4).map((outcome, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs uppercase tracking-[0.3em] font-semibold text-cyan-400">Key Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {course.skills?.map((skill) => (
                        <Badge key={skill} className="bg-cyan-500/20 text-cyan-300 border-0">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instructor Card */}
            <Card className="border border-slate-700 bg-slate-800/50">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-bold text-white">Your Instructor</h3>
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500" />
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold text-white">{course.instructor?.name}</p>
                    <p className="text-sm text-slate-400">{course.instructor?.title}</p>
                    <p className="text-sm text-slate-300 mt-2">{course.instructor?.bio}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Curriculum Section */}
            <Card className="border border-slate-700 bg-slate-800/50">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Curriculum</h2>
                  <Badge variant="outline" className="border-slate-600 text-slate-300">
                    {course.lessonsCompleted || 0}/{course.lessonsCount} completed
                  </Badge>
                </div>
                <LessonList courseId={course.id} lessons={course.lessons} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Support Card */}
            <Card className="border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">Mentor Support</h3>
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex items-start gap-2">
                    <MessageCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span>Weekly live office hours with {course.instructor?.name}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MessageCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span>Private cohort forum + tutor feedback</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MessageCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span>Email alerts for announcements</span>
                  </div>
                </div>
                <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white text-sm" asChild>
                  <Link href="/chat">Message Mentor</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Course Stats */}
            <Card className="border border-slate-700 bg-slate-800/50">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-bold text-white text-sm">Course Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Total Duration</span>
                    <span className="text-white font-medium">32 hours</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Level</span>
                    <span className="text-white font-medium">{course.level || 'Intermediate'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Projects</span>
                    <span className="text-white font-medium">4</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Certificate</span>
                    <span className="text-emerald-400 font-medium">Included</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related Courses */}
            <Card className="border border-slate-700 bg-slate-800/50">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-bold text-white text-sm">Next Steps</h3>
                <div className="space-y-3">
                  <p className="text-sm text-slate-400">After completing this course:</p>
                  <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 justify-start text-sm" asChild>
                    <Link href="/jobs">Browse Jobs</Link>
                  </Button>
                  <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 justify-start text-sm" asChild>
                    <Link href="/resumes">Update Resume</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
