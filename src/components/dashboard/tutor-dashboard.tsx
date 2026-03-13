"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, GraduationCap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";

interface TutorDashboardProps {
  userId: string;
}

interface TutorInsights {
  coursesCreated: number;
  studentEnrollments: number;
  avgCompletion: number;
  recentCourses: Array<{
    id: string;
    title: string;
    image: string;
  }>;
}

export function TutorDashboard({ userId }: TutorDashboardProps) {
  const [insights, setInsights] = useState<TutorInsights | null>(null);
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
        <div className="absolute -right-16 top-6 h-48 w-48 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-slate-500">Finbers Link</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900 sm:text-5xl">
              Teaching Dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-base text-slate-600">
              Monitor your courses, track student progress, and grow your reach.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              asChild
              className="rounded-full bg-purple-600 px-5 text-white shadow-lg shadow-purple-600/20 hover:bg-purple-700"
            >
              <Link href="/tutor/courses/new" className="text-sm font-medium">
                Create Course
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/tutor/analytics">View Analytics</Link>
            </Button>
          </div>
        </div>
      </header>

      {!loading && insights && (
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Courses Published"
            value={insights.coursesCreated}
            icon={GraduationCap}
            variant="minimal"
          />
          <StatCard
            title="Student Enrollments"
            value={insights.studentEnrollments}
            icon={Users}
            variant="minimal"
          />
          <StatCard
            title="Avg Completion Rate"
            value={`${insights.avgCompletion}%`}
            icon={BarChart3}
            variant="minimal"
          />
        </section>
      )}

      {!loading && insights && insights.recentCourses.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-semibold">Your Courses</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {insights.recentCourses.map((course) => (
              <Link
                key={course.id}
                href={`/tutor/courses/${course.id}`}
                className="group rounded-lg border border-slate-200 bg-white p-4 hover:border-purple-300 hover:shadow-md transition-all"
              >
                <div className="aspect-video mb-3 rounded-md bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
                  {course.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.image}
                      alt={course.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-purple-600">
                  {course.title}
                </h3>
                <p className="text-xs text-slate-600">Click to manage</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
