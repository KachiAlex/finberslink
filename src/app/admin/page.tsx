import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Briefcase,
  ClipboardCheck,
  Plus,
  GraduationCap,
  LineChart,
  MessageSquare,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import { getTenantAdminDashboard } from "@/features/admin/service";

import { AdminShell } from "./_components/admin-shell";

type TenantDashboard = Awaited<ReturnType<typeof getTenantAdminDashboard>>;

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

export default async function AdminOverviewPage({
  searchParams: _searchParamsPromise,
}: {
  searchParams?: Promise<{ courseStatus?: string }>;
}) {
  let dashboard;
  let dashboardError: unknown = null;
  try {
    dashboard = await getTenantAdminDashboard();
  } catch (err) {
    console.error("Failed to load tenant admin dashboard", err);
    dashboardError = err;
    dashboard = {
      overview: {
        stats: { courses: 0, students: 0, jobs: 0, enrollments: 0, resumes: 0, jobApplications: 0 },
        recentCourses: [],
        recentStudents: [],
        recentJobs: [],
      },
      courseSnapshot: { totals: { totalCourses: 0, tutorLedCourses: 0, adminDrafts: 0 }, levelMap: {}, recentCourses: [] },
      tutorCount: 0,
    };
  }
  const overview = dashboard.overview;

  const primaryStatConfig = [
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

  const studentsCount = overview.stats.students || 0;
  const resumesCount = overview.stats.resumes || 0;
  const applicationsCount = overview.stats.jobApplications || 0;
  const enrollmentsCount = overview.stats.enrollments || 0;
  const resumeCoverage = studentsCount > 0 ? Math.round((resumesCount / studentsCount) * 100) : 0;
  const applicationRate = studentsCount > 0 ? Math.round((applicationsCount / studentsCount) * 100) : 0;
  const enrollmentPerCourse = overview.stats.courses > 0 ? (enrollmentsCount / overview.stats.courses).toFixed(1) : "0.0";

  return (
    <div className="space-y-8">
      <AdminShell
        title="Tenant admin console"
        description="Manage courses, tutors, students, jobs, and forums across your tenant."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/users?role=STUDENT">Create student</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/users?role=TUTOR">Create tutor</Link>
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {primaryStatConfig.map(({ key, label, icon, accent }) => (
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

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Talent Outcomes</CardTitle>
              <CardDescription>Resume and application activity across your learner base.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <ClipboardCheck className="h-4 w-4 text-violet-600" />
                  Resumes created
                </div>
                <Badge variant="secondary" className="bg-violet-50 text-violet-700">{resumesCount}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Activity className="h-4 w-4 text-rose-600" />
                  Job applications
                </div>
                <Badge variant="secondary" className="bg-rose-50 text-rose-700">{applicationsCount}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Resume coverage</span>
                <span>{resumeCoverage}% of students</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Application rate</span>
                <span>{applicationRate}% of students</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Learning Health</CardTitle>
              <CardDescription>Enrollment density and learner momentum signals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <span className="text-sm font-medium text-slate-700">Active enrollments</span>
                <Badge variant="secondary" className="bg-amber-50 text-amber-700">{enrollmentsCount}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <span className="text-sm font-medium text-slate-700">Enrollments per course</span>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">{enrollmentPerCourse}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Courses available</span>
                <span>{overview.stats.courses}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Students onboarded</span>
                <span>{studentsCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-slate-200 shadow-sm lg:col-span-2">
            <CardHeader className="space-y-1">
              <CardTitle>Courses</CardTitle>
              <CardDescription>Review submissions, publish courses, and manage catalog operations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <DashboardError label="Courses unavailable" error={dashboardError} />
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                Course approval actions now live in the Courses tab for a cleaner dashboard overview.
              </div>
              <Button className="w-full sm:w-auto" asChild>
                <Link href="/admin/courses">Open courses manager</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle>Jobs</CardTitle>
              <CardDescription>Create and feature roles for your learners.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <DashboardError label="Jobs unavailable" error={dashboardError} />
              <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span>Open roles</span>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                  {overview.stats.jobs}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button className="w-full" asChild>
                  <Link href="/admin/jobs/new">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Create job posting
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/admin/jobs">
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    View all jobs
                  </Link>
                </Button>
              </div>
              <Button variant="ghost" className="w-full justify-start text-blue-700 hover:text-blue-900" asChild>
                <Link href="/admin/jobs/new">
                  Feature a role to boost visibility
                </Link>
              </Button>
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
                <Link href="/admin/students">
                  <Users className="mr-2 h-4 w-4" />
                  Open student roster
                </Link>
              </Button>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <span>Active students</span>
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                    {overview.stats.students}
                  </Badge>
                </div>
                <Button size="sm" variant="ghost" className="w-full justify-start text-slate-700 hover:text-slate-900" asChild>
                  <Link href="/admin/students?view=inactive">View inactive or flagged learners</Link>
                </Button>
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
                <Link href="/admin/tutors">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Open tutor roster
                </Link>
              </Button>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <span>Total tutors</span>
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">
                    {dashboard.tutorCount}
                  </Badge>
                </div>
                <Button size="sm" variant="ghost" className="w-full justify-start text-slate-700 hover:text-slate-900" asChild>
                  <Link href="/admin/courses?status=pending">Jump to pending course approvals</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle>Forums & chats</CardTitle>
              <CardDescription>Keep an eye on course conversations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                Keep conversations moving. Review threads, escalate flags, and seed helpful answers.
              </div>
              <div className="flex gap-2">
                <Button className="w-full" asChild>
                  <Link href="/forum">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    View forums
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/forum/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create cohort forum
                  </Link>
                </Button>
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
