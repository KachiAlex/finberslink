import { ArrowUpRight, BookOpen, Briefcase, GraduationCap, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { StatCard } from "@/components/ui/stat-card";
import { getAdminOverview } from "@/features/admin/service";

import { AdminShell } from "./_components/admin-shell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(date));

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview();

  const statConfig = [
    {
      key: "courses" as const,
      label: "Courses live",
      icon: BookOpen,
      accent: "bg-blue-600/10 text-blue-700",
    },
    {
      key: "students" as const,
      label: "Students onboarded",
      icon: GraduationCap,
      accent: "bg-emerald-600/10 text-emerald-700",
    },
    {
      key: "jobs" as const,
      label: "Jobs & roles",
      icon: Briefcase,
      accent: "bg-indigo-600/10 text-indigo-700",
    },
    {
      key: "enrollments" as const,
      label: "Active enrollments",
      icon: Users,
      accent: "bg-amber-500/10 text-amber-700",
    },
  ];

  return (
    <div className="space-y-8">
      <AdminShell
        title="Executive overview"
        description="Snapshots of program health, learner momentum, and employer demand."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statConfig.map(({ key, label, icon }) => (
            <StatCard
              key={key}
              title={label}
              value={overview.stats[key]}
              icon={icon}
              trend={{ value: 6, isPositive: true }}
              className="bg-gradient-to-br from-white/15 via-white/5 to-transparent text-white"
            />
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <GlassCard className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">Publishing</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Recently published courses</h2>
                <p className="text-white/70">
                  High-impact cohorts shipping to the marketplace
                </p>
              </div>
              <Button variant="ghost" size="sm" className="text-white/80" asChild>
                <a href="/admin/courses/new" className="inline-flex items-center gap-1">
                  Launch new course <ArrowUpRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
            <div className="mt-6 space-y-3">
              {overview.recentCourses.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                  No courses yet. Create one to unlock learner demand.
                </div>
              )}
              {overview.recentCourses.map((course: any) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{course.title}</p>
                    <p className="text-xs text-white/60">{course.category}</p>
                  </div>
                  <Badge variant="outline" className="border-white/30 bg-white/5 text-xs text-white">
                    {formatDate(course.createdAt)}
                  </Badge>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Employer ecosystem</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Recent job partners</h2>
                <p className="text-white/70">Supply pipeline shaping hiring outlook</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {overview.recentJobs.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                  No job postings yet. Use the Jobs tab to add the first employer.
                </div>
              )}
              {overview.recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 to-transparent px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{job.title}</p>
                    <p className="text-xs text-white/60">{job.company}</p>
                  </div>
                  <span className="text-xs text-white/50">{formatDate(job.createdAt)}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Talent flow</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">New learners</h2>
              <p className="text-white/70">Freshly onboarded students joining the experience</p>
            </div>
            <Badge variant="outline" className="border-white/30 bg-white/5 text-xs text-white">
              {overview.recentStudents.length} arrivals
            </Badge>
          </div>
          <div className="mt-6 divide-y divide-white/10">
            {overview.recentStudents.length === 0 && (
              <p className="py-4 text-sm text-white/70">
                Student roster will appear once people enroll.
              </p>
            )}
            {overview.recentStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-xs text-white/60">{student.email}</p>
                </div>
                <Badge variant="secondary" className="bg-white/15 text-xs capitalize text-white">
                  {student.status.toLowerCase()}
                </Badge>
              </div>
            ))}
          </div>
        </GlassCard>
      </AdminShell>
    </div>
  );
}
