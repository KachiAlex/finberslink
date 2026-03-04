import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Briefcase,
  ClipboardCheck,
  GraduationCap,
  LineChart,
  MessageSquare,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { GlassCard } from "@/components/ui/glass-card";
import { StatCard } from "@/components/ui/stat-card";
import { getTenantAdminDashboard } from "@/features/admin/service";

import { AdminShell } from "./_components/admin-shell";

function DashboardError({ label, error }: { label: string; error?: unknown }) {
  if (!error) return null;
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <p className="font-semibold">{label}</p>
      <p className="text-xs text-red-600/80">
        {error instanceof Error ? error.message : "Something went wrong. Try again."}
      </p>
    </div>
  );
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(date));

export default async function AdminOverviewPage() {
  let dashboard;
  let dashboardError: unknown = null;
  try {
    dashboard = await getTenantAdminDashboard();
  } catch (err) {
    console.error("Failed to load tenant admin dashboard", err);
    dashboardError = err;
    dashboard = {
      overview: {
        stats: { courses: 0, students: 0, jobs: 0, enrollments: 0 },
        recentCourses: [],
        recentStudents: [],
        recentJobs: [],
      },
      courseSnapshot: { totals: { totalCourses: 0, tutorLedCourses: 0, adminDrafts: 0 }, levelMap: {}, recentCourses: [] },
      tutorCount: 0,
    };
  }
  const overview = dashboard.overview;
  const courses = dashboard.courseSnapshot;

  const statConfig = [
    {
      key: "courses" as const,
      label: "Courses live",
      icon: BookOpen,
      accent: "bg-blue-50 text-blue-700",
    },
    {
      key: "students" as const,
      label: "Students onboarded",
      icon: GraduationCap,
      accent: "bg-emerald-50 text-emerald-700",
    },
    {
      key: "jobs" as const,
      label: "Jobs & roles",
      icon: Briefcase,
      accent: "bg-indigo-50 text-indigo-700",
    },
    {
      key: "enrollments" as const,
      label: "Active enrollments",
      icon: Users,
      accent: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <div className="space-y-8">
      <AdminShell
        title="Tenant admin console"
        description="Manage courses, tutors, students, jobs, and forums across your tenant."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <a href="/admin/users?role=STUDENT">Create student</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/admin/users?role=TUTOR">Create tutor</a>
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statConfig.map(({ key, label, icon, accent }) => (
            <StatCard
              key={key}
              title={label}
              value={overview.stats[key]}
              icon={icon}
              className={accent}
              trend={{ value: 6, isPositive: true }}
            />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-slate-200 shadow-sm lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Course submissions</CardTitle>
                <CardDescription>Review and publish courses submitted by tutors.</CardDescription>
              </div>
              <Button variant="outline" asChild>
                <a href="/admin/courses">
                  Manage courses <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <DashboardError label="Courses unavailable" error={dashboardError} />
              {courses.recentCourses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  No tutor submissions yet. Encourage tutors to submit their first course.
                </div>
              ) : (
                courses.recentCourses.map((course: any) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{course.title}</p>
                      <p className="text-xs text-slate-500">
                        {course.category} · {course.level}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs text-slate-600">
                        {course.instructor
                          ? `${course.instructor.firstName} ${course.instructor.lastName}`
                          : "Unknown tutor"}
                      </Badge>
                      <Badge variant="secondary" className="bg-amber-50 text-amber-600">
                        Pending review
                      </Badge>
                      <Button size="sm" variant="outline">
                        Approve
                      </Button>
                      <Button size="sm" variant="ghost" className="text-orange-600">
                        Request edits
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle>Jobs</CardTitle>
              <CardDescription>Create and feature roles for your learners.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <DashboardError label="Jobs unavailable" error={dashboardError} />
              <Button className="w-full" asChild>
                <a href="/admin/jobs/new">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Create job posting
                </a>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <a href="/admin/jobs">
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Manage jobs & approvals
                </a>
              </Button>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Activity</p>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                  Total jobs: {overview.stats.jobs}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle>Students</CardTitle>
              <CardDescription>Suspend, activate, view, edit learner details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <DashboardError label="Students unavailable" error={dashboardError} />
              <Button className="w-full" variant="outline" asChild>
                <a href="/admin/students">
                  <Users className="mr-2 h-4 w-4" />
                  Open student roster
                </a>
              </Button>
              <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span>Active students</span>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                  {overview.stats.students}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle>Tutors</CardTitle>
              <CardDescription>Review tutor courses and manage statuses.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <DashboardError label="Tutors unavailable" error={dashboardError} />
              <Button className="w-full" variant="outline" asChild>
                <a href="/admin/tutors">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Open tutor roster
                </a>
              </Button>
              <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span>Total tutors</span>
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">
                  {dashboard.tutorCount}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle>Forums & chats</CardTitle>
              <CardDescription>Keep an eye on course conversations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline" asChild>
                <a href="/forum">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  View course forums
                </a>
              </Button>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
                Monitor threads, escalate flags, and create new forums for upcoming cohorts.
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Performance & progress</CardTitle>
                <CardDescription>Learner momentum across courses.</CardDescription>
              </div>
              <LineChart className="h-5 w-5 text-slate-500" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span>Course completion</span>
                  <span>62%</span>
                </div>
                <Progress value={62} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span>Job placement</span>
                  <span>41%</span>
                </div>
                <Progress value={41} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span>Engaged learners</span>
                  <span>78%</span>
                </div>
                <Progress value={78} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Alerts & actions</CardTitle>
                <CardDescription>Students or courses needing attention.</CardDescription>
              </div>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
                3 students flagged for inactivity. Review in the student roster.
              </div>
              <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                1 tutor course awaiting approval.
              </div>
              <Button variant="outline" className="w-full" asChild>
                <a href="/admin/system">
                  <Activity className="mr-2 h-4 w-4" />
                  Open admin system panel
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminShell>
    </div>
  );
}
