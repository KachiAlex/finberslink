import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listForumThreads } from "@/features/forum/service";
import { CourseHero } from "@/features/lms/components/course-hero";
import { LessonList } from "@/features/lms/components/lesson-list";
import { ResourceLibrary } from "@/components/course/resource-library";
import { getCourseWithProgress } from "@/features/lms/data/course-service";
import { getSessionFromCookies } from "@/lib/auth/session";
import { Star, Users, Clock, CheckCircle2, BookOpen, MessageCircle, Download, Share2, Award, Calendar, Target, TrendingUp, User } from "lucide-react";
import Link from "next/link";
import { CourseOverviewTab } from "@/features/course/components/course-overview-tab";
import { CourseCurriculumTab } from "@/features/course/components/course-curriculum-tab";
import { CourseReviewsTab } from "@/features/course/components/course-reviews-tab";
import { CourseResourcesTab } from "@/features/course/components/course-resources-tab";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CourseDetailPage(props: any) {
  const { courseId } = props.params as { courseId: string };
  
  // Courses are completely gated - require authentication
  const session = await requireSession({ 
    allowedRoles: ["STUDENT", "TUTOR", "EMPLOYER", "ADMIN", "SUPER_ADMIN"],
    failureMode: "redirect",
    redirectTo: "/login?reason=course-access"
  });
  
  let course;
  try {
    course = await getLearnerCourseDetail(courseId, session.sub);
  } catch (error) {
    console.error("[course-detail] failed to fetch course:", error);
    notFound();
  }

  if (!course) {
    notFound();
  }

  const progressPercentage = course.lessonsCompleted ? Math.round((course.lessonsCompleted / course.lessonsCount) * 100) : 0;

  // Extract all resources from lessons for the ResourceLibrary
  const allResources = course.lessons?.flatMap(lesson => lesson.resources || []).map(resource => ({
    id: resource.id,
    title: resource.title,
    type: resource.type,
    url: resource.url,
    uploadedAt: new Date().toISOString(), // Use current date as fallback
    courseId: course.id
  })) || [];

  // Add sample resources for testing if no real resources exist
  if (allResources.length === 0) {
    allResources.push(
      {
        id: 'sample-pdf-1',
        title: 'Course Guide PDF',
        type: 'pdf',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        uploadedAt: new Date().toISOString(),
        courseId: course.id
      },
      {
        id: 'sample-video-1', 
        title: 'Introduction Video',
        type: 'video',
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&showinfo=0&modestbranding=1',
        uploadedAt: new Date().toISOString(),
        courseId: course.id
      },
      {
        id: 'sample-image-1',
        title: 'Course Diagram',
        type: 'image', 
        url: 'https://picsum.photos/400/300',
        uploadedAt: new Date().toISOString(),
        courseId: course.id
      }
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      
      {/* Course Header Section */}
      <section className="bg-white border-b">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Course Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Meta */}
              <div className="flex items-center gap-4 flex-wrap">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  {course.level || 'Intermediate'}
                </Badge>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-medium text-gray-700">4.8 (324 reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{course.enrollmentCount || 0}+ students</span>
                </div>
              </div>

              {/* Course Title */}
              <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                {course.name || course.title}
              </h1>

              {/* Course Description */}
              <p className="text-lg text-gray-600 leading-relaxed">
                {course.description}
              </p>

              {/* Course Stats */}
              <div className="flex gap-6 flex-wrap">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span className="text-sm">{course.lessonsCount || 0} lessons</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <span className="text-sm">8 weeks</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Award className="w-5 h-5 text-blue-500" />
                  <span className="text-sm">Certificate</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Target className="w-5 h-5 text-blue-500" />
                  <span className="text-sm">4 projects</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {course.lessons && course.lessons.length > 0 ? (
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3" asChild>
                    <Link href={`/courses/${course.id}/lessons/${course.lessons[0]?.id}`}>
                      <BookOpen className="w-4 h-4 mr-2" />
                      Start Learning
                    </Link>
                  </Button>
                ) : (
                  <Button className="bg-gray-400 cursor-not-allowed text-white px-6 py-3" disabled>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Coming Soon
                  </Button>
                )}
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            {/* Progress & Enrollment Card */}
            <div className="lg:col-span-1">
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-6 space-y-6">
                  {/* Progress Section */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Your Progress</span>
                      <span className="text-2xl font-bold text-blue-600">{progressPercentage}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-gray-200">
                      <div 
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{course.lessonsCompleted || 0} completed</span>
                      <span>{course.lessonsCount} total</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time Invested</span>
                        <span className="font-medium text-gray-900">12 hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Access</span>
                        <span className="font-medium text-gray-900">2 days ago</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white" 
                    disabled={progressPercentage < 100}
                  >
                    <Award className="w-4 h-4 mr-2" />
                    {progressPercentage >= 100 ? 'Claim Certificate' : 'Complete Course to Unlock'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Tabbed Content Section */}
      <section className="bg-gray-50 py-8">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-white border border-gray-200 p-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Overview
              </TabsTrigger>
              <TabsTrigger value="curriculum" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Curriculum
              </TabsTrigger>
              <TabsTrigger value="instructor" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Instructor
              </TabsTrigger>
              <TabsTrigger value="reviews" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Reviews
              </TabsTrigger>
              <TabsTrigger value="resources" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Resources
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <CourseOverviewTab course={course} />
            </TabsContent>

            {/* Curriculum Tab */}
            <TabsContent value="curriculum" className="space-y-6">
              <CourseCurriculumTab courseId={course.id} lessons={course.lessons} />
            </TabsContent>

            {/* Instructor Tab */}
            <TabsContent value="instructor" className="space-y-6">
              <Card className="border-gray-200 bg-white">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                      {course.instructor?.name?.charAt(0) || 'I'}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{course.instructor?.name || 'Course Instructor'}</h3>
                        <p className="text-gray-600">{course.instructor?.title || 'Expert Instructor'}</p>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {course.instructor?.bio || 'Experienced instructor passionate about helping students achieve their learning goals.'}
                      </p>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>10,000+ students</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          <span>4.8 rating</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          <span>12 courses</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-6">
              <CourseReviewsTab courseId={course.id} />
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources" className="space-y-6">
              <CourseResourcesTab resources={allResources} courseId={course.id} />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
