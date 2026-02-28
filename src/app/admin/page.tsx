import { BookOpen, Briefcase, GraduationCap, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
          {statConfig.map(({ key, label, icon: Icon, accent }) => (
            <Card key={key} className="border border-slate-200/70 bg-white/95">
              <CardHeader className="flex flex-row items-center justify-between px-5 pb-2 pt-5">
                <CardTitle className="text-sm font-medium text-slate-500">{label}</CardTitle>
                <span className={`rounded-full p-2 text-xs ${accent}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <p className="text-3xl font-semibold text-slate-900">{overview.stats[key]}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border border-slate-200/60 bg-white/95">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">
                Recently published courses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {overview.recentCourses.length === 0 && (
                <p className="text-sm text-slate-500">No courses yet. Create one to kickstart cohorts.</p>
              )}
              {overview.recentCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{course.title}</p>
                    <p className="text-xs text-slate-500">{course.category}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {formatDate(course.createdAt)}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-slate-200/60 bg-white/95">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">Recent job partners</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {overview.recentJobs.length === 0 && (
                <p className="text-sm text-slate-500">No job postings yet. Use the Jobs tab to add one.</p>
              )}
              {overview.recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{job.title}</p>
                    <p className="text-xs text-slate-500">{job.company}</p>
                  </div>
                  <span className="text-xs text-slate-500">{formatDate(job.createdAt)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border border-slate-200/60 bg-white/95">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">New learners</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100">
            {overview.recentStudents.length === 0 && (
              <p className="py-4 text-sm text-slate-500">Student roster will appear once people enroll.</p>
            )}
            {overview.recentStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-xs text-slate-500">{student.email}</p>
                </div>
                <Badge variant="secondary" className="text-xs capitalize">
                  {student.status.toLowerCase()}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </AdminShell>
    </div>
  );
}
