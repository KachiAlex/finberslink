"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, GraduationCap, Lock, Unlock, Users } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

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

export function TutorDashboard({ userId: _userId }: TutorDashboardProps) {
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
      <DashboardHero
        eyebrow="Tutor workspace"
        title="Run your courses and coaching in one view"
        description="Jump back into drafts, check progress, and nudge your cohorts without hopping between tabs."
        accent="purple"
        actions={[
          { label: "Manage courses", href: "/tutor/courses" },
          { label: "Review analytics", href: "/tutor/analytics", variant: "secondary" },
        ]}
      />

      {!loading && insights && (
        <DashboardSection
          eyebrow="Snapshot"
          title="Impact metrics"
          description="Health of your teaching practice"
        >
          <p className="text-xs text-slate-500">Stats roll up the last 30 days across every course you lead.</p>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard title="Courses Published" value={insights.coursesCreated} icon={GraduationCap} variant="minimal" />
            <StatCard title="Student Enrollments" value={insights.studentEnrollments} icon={Users} variant="minimal" />
            <StatCard title="Avg Completion Rate" value={`${insights.avgCompletion}%`} icon={BarChart3} variant="minimal" />
          </div>
        </DashboardSection>
      )}

      {!loading && insights && insights.recentCourses.length > 0 && (
        <DashboardSection
          eyebrow="Courses"
          title="Your cohorts"
          description="Stay close to drafts and approved tracks"
          actions={[{ label: "Manage all courses", href: "/tutor/courses", variant: "secondary" }]}
        >
          <p className="text-xs text-slate-500">Courses update in real time as learners finish lessons or admins lock edits.</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {insights.recentCourses.map((course) => (
              <Link
                key={course.id}
                href={`/tutor/courses/${course.id}`}
                className="group rounded-lg border border-slate-200 bg-white p-4 transition-all hover:border-purple-300 hover:shadow-md"
              >
                <div className="aspect-video mb-3 overflow-hidden rounded-md bg-gradient-to-br from-purple-100 to-pink-100">
                  {course.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={course.image} alt={course.title} className="h-full w-full object-cover" />
                  )}
                </div>
                <h3 className="mb-2 font-semibold text-slate-900 group-hover:text-purple-600">{course.title}</h3>
                <div className="mb-2 flex items-center gap-2 text-xs text-slate-600">
                  <Badge variant="outline" className="border-transparent bg-slate-100 text-slate-700 capitalize">
                    {course.approvalStatus ? course.approvalStatus.toLowerCase() : "pending"}
                  </Badge>
                  {course.tutorEditingLocked ? (
                    <span className="flex items-center gap-1 text-rose-600">
                      <Lock className="h-3 w-3" /> Editing locked
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <Unlock className="h-3 w-3" /> Editing open
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  {course.tutorEditingLocked
                    ? "Approved and locked. Contact admin to re-open."
                    : "Click to manage your draft."}
                </p>
              </Link>
            ))}
          </div>
        </DashboardSection>
      )}
    </>
  );
}
