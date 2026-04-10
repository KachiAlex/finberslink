import { redirect } from "next/navigation";
import { Badge } from "../components/ui/badge";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/features/lms/components/course-card";
import { listLearnerCourses } from "@/features/lms/data/course-service";
import { GradientText } from "../components/shared/animated-components";
import { ArrowRight, BookOpen, Search, Filter, Star, Users, Clock, Trophy } from "lucide-react";
import Link from "next/link";
import { requireSession } from "../lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CoursesPage() {
  // Check if user is authenticated
  const session = await requireSession({
    failureMode: "allow" as any,
  });

  // Redirect authenticated students to dashboard courses
  if (session && session.role === "STUDENT") {
    redirect("/dashboard/courses");
  }

  const courses = await listLearnerCourses();
  
  // Split courses into featured, popular, and all
  const featuredCourses = courses.slice(0, 3);
  const popularCourses = courses.slice(0, 6);
  const allCourses = courses;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Enhanced Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        {/* Background gradient orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen opacity-20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-screen opacity-20 blur-3xl" />
        <div className="absolute top-1/2 right-0 translate-x-1/2 w-96 h-96 bg-emerald-500 rounded-full mix-blend-screen opacity-20 blur-3xl" />
        
        <div className="relative mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <Badge className="mx-auto bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30">
              ✨ Skill-to-Employment Pathways
            </Badge>
            
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white">
              Master Skills That
              <br />
              <GradientText className="text-5xl sm:text-6xl">Get You Hired</GradientText>
            </h1>
            
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Industry-aligned courses with live mentorship, hands-on projects, and verified certificates. 
              Start your transformation today.
            </p>

            {/* Search Bar */}
            <div className="mt-8 flex gap-2 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search courses, skills, or topics..."
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="pt-8 flex justify-center gap-8 flex-wrap text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>{courses.length}+ Courses</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>Mentor-Led</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span>Job-Ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Featured Spotlight Section */}
        {featuredCourses.length > 0 && (
          <section className="mb-20 space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-8 h-8 text-yellow-400" />
                Featured Programs
              </h2>
              <p className="text-slate-300 mt-2">Our most popular and highest-rated courses</p>
            </div>
            
            <div className="grid gap-6 lg:grid-cols-3">
              {featuredCourses.map((course: any) => (
                <div key={course.id} className="group relative rounded-xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-800 border border-slate-700 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300">
                  {/* Gradient border effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-emerald-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none" />
                  
                  <div className="relative p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <Badge className="bg-cyan-500/20 text-cyan-300 border-0">Featured</Badge>
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {course.name || course.title || 'Untitled Course'}
                      </h3>
                      <p className="text-sm text-slate-400 mt-2">{course.description?.substring(0, 100)}...</p>
                    </div>

                    <div className="flex gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>8 weeks</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{course.enrollmentCount || 0} students</span>
                      </div>
                    </div>

                    <Button asChild className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">
                      <Link href={`/courses/${course.slug || course.id}`}>
                        Explore Course <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Filter Section */}
        <section className="mb-12 flex flex-col gap-6 lg:flex-row">
          {/* Sidebar Filters */}
          <aside className="lg:w-64">
            <div className="sticky top-4 space-y-6">
              <div className="rounded-lg bg-slate-800 p-4 border border-slate-700">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </h3>

                {/* Difficulty Filter */}
                <div className="space-y-3 pb-4 border-b border-slate-700">
                  <p className="text-sm font-medium text-slate-400">Difficulty</p>
                  <div className="space-y-2">
                    {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                      <label key={level} className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer">
                        <input type="checkbox" className="rounded border-slate-600 bg-slate-700" />
                        <span className="text-sm">{level}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Duration Filter */}
                <div className="space-y-3 pb-4 border-b border-slate-700">
                  <p className="text-sm font-medium text-slate-400">Duration</p>
                  <div className="space-y-2">
                    {['4 weeks', '8 weeks', '12+ weeks'].map((duration) => (
                      <label key={duration} className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer">
                        <input type="checkbox" className="rounded border-slate-600 bg-slate-700" />
                        <span className="text-sm">{duration}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-400">Category</p>
                  <div className="space-y-2">
                    {['Tech', 'Design', 'Business', 'Data Science'].map((category) => (
                      <label key={category} className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer">
                        <input type="checkbox" className="rounded border-slate-600 bg-slate-700" />
                        <span className="text-sm">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 space-y-8">
            {/* Sorting */}
            <div className="flex items-center justify-between">
              <p className="text-slate-400">Showing {courses.length} courses</p>
              <select className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500">
                <option>Most Popular</option>
                <option>Newest First</option>
                <option>Highest Rated</option>
                <option>Most Students</option>
              </select>
            </div>

            {/* Course Grid */}
            {allCourses.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-700 bg-slate-800/50 p-12 text-center">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-300 mb-2">No courses available yet</h3>
                <p className="text-slate-400">Check back soon for our upcoming programs</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {allCourses.map((course: any) => (
                  <div key={course.id} className="group rounded-xl overflow-hidden bg-slate-800 border border-slate-700 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
                    {/* Course Header */}
                    <div className="h-40 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border-b border-slate-700 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                      <BookOpen className="w-12 h-12 text-cyan-400/50 group-hover:text-cyan-400 group-hover:scale-110 transition-all duration-300" />
                    </div>

                    <div className="p-5 space-y-4">
                      <div>
                        <h3 className="font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                          {course.name || course.title || 'Untitled'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">{course.level || 'Self-paced'}</p>
                      </div>

                      <div className="flex gap-3 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          8 weeks
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {course.enrollmentCount || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          4.8
                        </div>
                      </div>

                      <Button asChild variant="outline" size="sm" className="w-full border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10">
                        <Link href={`/courses/${course.slug || course.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Learning Benefits Section */}
        <section className="rounded-xl bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/20 p-8 space-y-6">
          <h2 className="text-2xl font-bold text-white">Why Learn with Us?</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Trophy, title: 'Job-Ready Skills', desc: 'Industry-aligned curriculum' },
              { icon: Users, title: 'Live Mentorship', desc: 'Weekly office hours & support' },
              { icon: Star, title: 'Certificates', desc: 'Verified credentials' },
              { icon: ArrowRight, title: 'Career Growth', desc: 'Job placement support' },
            ].map((benefit, idx) => (
              <div key={idx} className="space-y-2">
                <benefit.icon className="w-6 h-6 text-cyan-400" />
                <h3 className="font-semibold text-white">{benefit.title}</h3>
                <p className="text-sm text-slate-300">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
