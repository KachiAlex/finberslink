"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, GraduationCap, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";

interface StudentDashboardProps {
  userId: string;
}

interface StudentInsights {
  coursesEnrolled: number;
  activeProgress: number;
  recentCourses: Array<{
    id: string;
    title: string;
    progress: number;
    image: string;
  }>;
}

export function StudentDashboard({ userId }: StudentDashboardProps) {
  const [insights, setInsights] = useState<StudentInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await fetch("/api/dashboard/insights");
        const data = await res.json();
        setInsights(data.insights);
      } catch (error) {
        console.error("Failed to fetch insights:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  return (
    <>
      <header className="rounded-4xl relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg shadow-slate-200/70">
        <div className="absolute -right-16 top-6 h-48 w-48 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-slate-500">Finbers Link</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900 sm:text-5xl">
              Your learning dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-base text-slate-600">
              Track your course progress, manage your resume, and explore job opportunities.
            </p>
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            <Button
              variant="outline"
              className="border-slate-200 text-slate-700 hover:bg-slate-100"
              asChild
            >
              <Link href="/courses" className="flex items-center gap-2">
                Explore courses
              </Link>
            </Button>
            <Button
              asChild
              className="rounded-full bg-slate-900 px-5 text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800"
            >
              <Link href="/jobs" className="flex items-center gap-2 text-sm font-medium">
                Find jobs <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-sm">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <span>Messages</span>
              <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                0
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {!loading && insights && (
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Active Courses"
            value={insights.coursesEnrolled}
            icon={GraduationCap}
            variant="minimal"
          />
          <StatCard
            title="Average Progress"
            value={`${insights.activeProgress}%`}
            icon={Sparkles}
            variant="minimal"
          />
          <StatCard
            title="Ready to Apply"
            value="1+"
            icon={Briefcase}
            variant="minimal"
          />
        </section>
      )}

      {!loading && insights && insights.recentCourses.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-semibold">Recent Courses</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {insights.recentCourses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="group rounded-lg border border-slate-200 bg-white p-4 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="aspect-video mb-3 rounded-md bg-gradient-to-br from-slate-200 to-slate-300 overflow-hidden group-hover:from-blue-100 group-hover:to-blue-200">
                  {course.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.image}
                      alt={course.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-blue-600">
                  {course.title}
                </h3>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-600 mt-2">{course.progress}% complete</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
