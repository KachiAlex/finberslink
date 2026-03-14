import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
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
import { GlassCard } from "@/components/ui/glass-card";
import { StatCard } from "@/components/ui/stat-card";
import { getTenantAdminDashboard } from "@/features/admin/service";

import { AdminShell } from "./_components/admin-shell";
import { CourseActionButtons } from "./_components/course-action-buttons";

type TenantDashboard = Awaited<ReturnType<typeof getTenantAdminDashboard>>;
type CourseSnapshot = TenantDashboard["courseSnapshot"];
type SnapshotCourse = CourseSnapshot["recentCourses"][number];
type CourseApprovalStatus = "PENDING" | "APPROVED" | "CHANGES";
type SnapshotCourseWithStatus = SnapshotCourse & { approvalStatus?: CourseApprovalStatus | null };

const COURSE_STATUS_OPTIONS: readonly CourseApprovalStatus[] = ["PENDING", "APPROVED", "CHANGES"] as const;
const DEFAULT_COURSE_STATUS: CourseApprovalStatus = "PENDING";

const getCourseStatus = (course: SnapshotCourseWithStatus): CourseApprovalStatus => {
  const rawStatus = course.approvalStatus?.toUpperCase() as CourseApprovalStatus | undefined;
  if (rawStatus && COURSE_STATUS_OPTIONS.includes(rawStatus)) {
    return rawStatus;
  }
  return DEFAULT_COURSE_STATUS;
};

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
  searchParams: searchParamsPromise,
}: {
  searchParams?: Promise<{ courseStatus?: string }>;
}) {
  const searchParams = await searchParamsPromise;
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
  const courseSnapshot = dashboard.courseSnapshot;

  const requestedStatus = searchParams?.courseStatus?.toUpperCase() as CourseApprovalStatus | undefined;
  const courseStatusFilter = requestedStatus && COURSE_STATUS_OPTIONS.includes(requestedStatus) ? requestedStatus : undefined;

  const filteredCourses =
    courseStatusFilter && courseSnapshot.recentCourses.length
      ? courseSnapshot.recentCourses.filter(
          (course) => getCourseStatus(course as SnapshotCourseWithStatus) === courseStatusFilter
        )
      : courseSnapshot.recentCourses;

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
              <Link href="/admin/users?role=STUDENT">Create student</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/users?role=TUTOR">Create tutor</Link>
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
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                  <Link href="/admin/courses">
                    Manage courses <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <DashboardError label="Courses unavailable" error={dashboardError} />
              <div className="flex flex-wrap gap-2">
                {COURSE_STATUS_OPTIONS.map((status) => {
                  const isActive = courseStatusFilter === status;
                  const href = status === "PENDING" ? "/admin?courseStatus=PENDING" : `/admin?courseStatus=${status}`;
                  return (
                    <Button
                      key={status}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      asChild
                      className={isActive ? "bg-slate-900 text-white" : "border-slate-200 text-slate-700"}
                    >
                      <Link href={href}>{status === "CHANGES" ? "Needs edits" : status}</Link>
                    </Button>
                  );
                })}
                {courseStatusFilter ? (
                  <Button variant="ghost" size="sm" asChild className="text-slate-600 hover:text-slate-900">
                    <Link href="/admin">Clear filter</Link>
                  </Button>
                ) : null}
              </div>
              {(filteredCourses.length === 0 && courseStatusFilter) || courseSnapshot.recentCourses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  No tutor submissions match this filter. Encourage tutors to submit their first course.
                </div>
              ) : (
                filteredCourses.map((course) => {
                  const courseWithStatus = course as SnapshotCourseWithStatus;
                  const status = getCourseStatus(courseWithStatus);
                  const statusLabel =
                    status === "APPROVED" ? "Approved" : status === "CHANGES" ? "Needs edits" : "Pending review";
                  const statusClass =
                    status === "APPROVED"
                      ? "bg-emerald-50 text-emerald-600"
                      : status === "CHANGES"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-amber-50 text-amber-600";
                  return (
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
                        <Badge variant="secondary" className={statusClass}>
                          {statusLabel}
                        </Badge>
                        <CourseActionButtons courseId={course.id} currentStatus={status} />
                      </div>
                    </div>
                  );
                })
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
