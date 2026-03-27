import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { BookOpenCheck, Layers3, Palette, Users2 } from "lucide-react";

type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

const CourseLevelValues = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import {
  createAdminCourse,
  getCourseManagementSnapshot,
  listArchivedCourses,
  listAdminCourses,
  listCoursesWithPendingEdits,
  requireAdminUser,
} from "@/features/admin/service";

import { AdminShell } from "../_components/admin-shell";
import { CourseActionButtons } from "../_components/course-action-buttons";
import { CourseAdminActionButton } from "./_components/course-admin-actions";
import { CreateCourseSheet } from "./_components/create-course-sheet";

type AdminCourse = Awaited<ReturnType<typeof listAdminCourses>>[number];
type ArchivedCourse = Awaited<ReturnType<typeof listArchivedCourses>>[number];
type PendingEditCourse = Awaited<ReturnType<typeof listCoursesWithPendingEdits>>[number];
type CourseSnapshot = Awaited<ReturnType<typeof getCourseManagementSnapshot>>;
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

const formatShortDate = (date: Date | string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(date));

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function createCourseAction(formData: FormData) {
  "use server";

  const admin = await requireAdminUser();

  const slug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const level = String(formData.get("level") ?? "BEGINNER").toUpperCase() as CourseLevel;
  const coverImage = String(formData.get("coverImage") ?? "").trim();

  if (!slug || !title || !description) {
    notFound();
  }

  await createAdminCourse({
    slug,
    title,
    tagline,
    description,
    category,
    level,
    coverImage,
  });

  revalidatePath("/admin/courses");
}

export default async function AdminCoursesPage({
  searchParams: searchParamsPromise,
}: {
  searchParams?: Promise<{ status?: string; courseStatus?: string }>;
}) {
  const searchParams = await searchParamsPromise;
  const [admin, courses, pendingEditCourses, archivedCourses, snapshot] = await Promise.all([
    requireAdminUser(),
    listAdminCourses(),
    listCoursesWithPendingEdits(),
    listArchivedCourses(),
    getCourseManagementSnapshot(),
  ]);

  const requestedStatus = (searchParams?.status ?? searchParams?.courseStatus)?.toUpperCase() as
    | CourseApprovalStatus
    | undefined;
  const submissionStatusFilter =
    requestedStatus && COURSE_STATUS_OPTIONS.includes(requestedStatus) ? requestedStatus : undefined;

  const filteredSubmissions =
    submissionStatusFilter && snapshot.recentCourses.length
      ? snapshot.recentCourses.filter(
          (course) => getCourseStatus(course as SnapshotCourseWithStatus) === submissionStatusFilter
        )
      : snapshot.recentCourses;

  const statCards = [
    {
      title: "Total catalog",
      value: snapshot.totals.totalCourses,
      icon: Layers3,
      trend: { value: 6, isPositive: true },
    },
    {
      title: "Tutor-led",
      value: snapshot.totals.tutorLedCourses,
      icon: Users2,
      trend: { value: 11, isPositive: true },
    },
    {
      title: "Admin drafts",
      value: snapshot.totals.adminDrafts,
      icon: Palette,
      trend: { value: 2, isPositive: false },
    },
    {
      title: "Launch-ready",
      value: courses.filter((course) => course._count?.enrollments ?? 0 > 0).length,
      icon: BookOpenCheck,
      trend: { value: 4, isPositive: true },
    },
  ] as const;

  return (
    <div className="space-y-8">
      <AdminShell
        title="Courses"
        description="Launch and track cohort experiences with instructor assignments and enrollment pulses."
        actions={<Badge variant="secondary">{admin.role.replace("_", " ")} access</Badge>}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              trend={stat.trend}
              className="bg-gradient-to-br from-white to-slate-50"
            />
          ))}
        </div>

        <div className="space-y-6">
          <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Catalog actions</p>
              <p className="text-base font-semibold text-slate-900">Launch or manage courses</p>
            </div>
            <CreateCourseSheet action={createCourseAction} levels={CourseLevelValues} />
          </div>

          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">Course submissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {COURSE_STATUS_OPTIONS.map((status) => {
                  const isActive = submissionStatusFilter === status;
                  const href = status === "PENDING" ? "/admin/courses?status=PENDING" : `/admin/courses?status=${status}`;
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
                {submissionStatusFilter ? (
                  <Button variant="ghost" size="sm" asChild className="text-slate-600 hover:text-slate-900">
                    <Link href="/admin/courses">Clear filter</Link>
                  </Button>
                ) : null}
              </div>
              {(filteredSubmissions.length === 0 && submissionStatusFilter) || snapshot.recentCourses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  No tutor submissions match this filter. Encourage tutors to submit their first course.
                </div>
              ) : (
                filteredSubmissions.map((course) => {
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
                      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{course.title}</p>
                        <p className="text-xs text-slate-500">
                          {course.category} · {course.level}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
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

          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">Live catalog</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-slate-500">
                      <th className="pb-3">Title</th>
                      <th className="pb-3">Instructor</th>
                      <th className="pb-3">Level</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Enrollments</th>
                      <th className="pb-3">Created</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                          <tbody className="divide-y divide-slate-100">
                    {courses.map((course: AdminCourse) => {
                      const levelLabel = (course.level ?? "BEGINNER").toString().toLowerCase();
                      const categoryLabel = course.category ?? "general";
                      const instructorRoleLabel = course.instructor?.role === "TUTOR" ? "Tutor" : "Admin";
                      const enrollmentCount = course._count?.enrollments ?? 0;

                      return (
                        <tr key={course.id} className="text-slate-700">
                          <td className="py-3">
                            <div className="font-semibold">{course.title}</div>
                            <p className="text-xs text-slate-500">{categoryLabel}</p>
                          </td>
                          <td>
                            <div className="text-sm font-medium">
                              {course.instructor?.firstName} {course.instructor?.lastName}
                            </div>
                            <p className="text-xs text-slate-500">{instructorRoleLabel} author</p>
                          </td>
                          <td className="capitalize">{levelLabel}</td>
                          <td>
                            <Badge variant="outline" className="text-xs">
                              {course.approvalStatus.toLowerCase()}
                            </Badge>
                            {course.hasPendingEdit ? (
                              <p className="mt-1 text-xs text-violet-600">Pending edit review</p>
                            ) : null}
                          </td>
                          <td>{enrollmentCount}</td>
                          <td>{formatShortDate(course.createdAt)}</td>
                          <td>
                            <div className="flex justify-end">
                              <CourseAdminActionButton
                                courseId={course.id}
                                action="archive"
                                label="Archive"
                                variant="ghost"
                                className="text-rose-600"
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {courses.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-sm text-slate-500">
                          No courses yet. Use the “New course” action to launch your first cohort.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-violet-200/70 bg-violet-50/40">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-violet-900">Pending Tutor Edit Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-violet-700">
                      <th className="pb-3">Course</th>
                      <th className="pb-3">Tutor</th>
                      <th className="pb-3">Submitted</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-violet-100">
                    {pendingEditCourses.map((course: PendingEditCourse) => {
                      const pendingEdit = course.pendingEdit as { submittedAt?: string } | null;
                      return (
                        <tr key={course.id} className="text-slate-700">
                          <td className="py-3">
                            <p className="font-semibold">{course.title}</p>
                            <p className="text-xs text-slate-500">{course.category}</p>
                          </td>
                          <td>
                            <p className="text-sm">
                              {course.instructor?.firstName} {course.instructor?.lastName}
                            </p>
                          </td>
                          <td>
                            {pendingEdit?.submittedAt
                              ? formatShortDate(pendingEdit.submittedAt)
                              : formatShortDate(course.updatedAt)}
                          </td>
                          <td>
                            <div className="flex justify-end gap-2">
                              <CourseAdminActionButton
                                courseId={course.id}
                                action="approve-edit"
                                label="Approve edit"
                                variant="outline"
                                className="border-emerald-300 text-emerald-700"
                              />
                              <CourseAdminActionButton
                                courseId={course.id}
                                action="reject-edit"
                                label="Reject"
                                variant="ghost"
                                className="text-rose-600"
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {pendingEditCourses.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-sm text-slate-500">
                          No pending tutor edit requests.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">Archived Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-slate-500">
                      <th className="pb-3">Title</th>
                      <th className="pb-3">Instructor</th>
                      <th className="pb-3">Archived</th>
                      <th className="pb-3">Enrollments</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {archivedCourses.map((course: ArchivedCourse) => (
                      <tr key={course.id} className="text-slate-700">
                        <td className="py-3">
                          <div className="font-semibold">{course.title}</div>
                          <p className="text-xs text-slate-500">{course.category}</p>
                        </td>
                        <td>
                          {course.instructor?.firstName} {course.instructor?.lastName}
                        </td>
                        <td>{course.archivedAt ? formatShortDate(course.archivedAt) : "-"}</td>
                        <td>{course._count?.enrollments ?? 0}</td>
                        <td>
                          <div className="flex justify-end">
                            <CourseAdminActionButton
                              courseId={course.id}
                              action="restore"
                              label="Restore"
                              variant="outline"
                              className="border-indigo-300 text-indigo-700"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {archivedCourses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm text-slate-500">
                          No archived courses.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">
                Level mix
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {CourseLevelValues.map((level) => {
                const value = snapshot.levelMap[level] ?? 0;
                const percentage = snapshot.totals.totalCourses
                  ? Math.round((value / snapshot.totals.totalCourses) * 100)
                  : 0;
                return (
                  <div key={level}>
                    <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                      <span>{level.toLowerCase()}</span>
                      <span>{value} · {percentage}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">
                Recent releases
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {snapshot.recentCourses.length === 0 && (
                <p className="text-sm text-slate-500">No course launches yet.</p>
              )}
              {snapshot.recentCourses.map((course: SnapshotCourse) => (
                <div
                  key={course.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{course.title}</p>
                      <p className="text-xs text-slate-500">
                        {course.instructor?.firstName} {course.instructor?.lastName} · {course.level.toLowerCase()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {course.category}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Published {formatShortDate(course.createdAt)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </AdminShell>
    </div>
  );
}
