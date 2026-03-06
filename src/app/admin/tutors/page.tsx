import { revalidatePath } from "next/cache";
import type { UserStatus } from "@prisma/client";
import {
  ShieldCheck,
  ShieldX,
  Sparkles,
  UserPlus2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatCard } from "@/components/ui/stat-card";
import {
  getTutorManagementSnapshot,
  listTutors,
  requireAdminUser,
  updateUserStatus,
} from "@/features/admin/service";

import { AdminShell } from "../_components/admin-shell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const statusOptions: UserStatus[] = ["ACTIVE", "INVITED", "SUSPENDED"];

const statusStyles: Record<UserStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INVITED: "bg-amber-100 text-amber-700",
  SUSPENDED: "bg-rose-100 text-rose-700",
};

async function updateTutorStatusAction(formData: FormData) {
  "use server";

  await requireAdminUser();

  const tutorId = String(formData.get("tutorId") ?? "");
  const status = String(formData.get("status") ?? "ACTIVE").toUpperCase() as UserStatus;

  if (!tutorId) return;

  await updateUserStatus(tutorId, status);
  revalidatePath("/admin/tutors");
}

export default async function AdminTutorsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    status?: UserStatus;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const filters = {
    search: params.search ?? "",
    status: (params.status as UserStatus) ?? undefined,
    page: params.page ? parseInt(params.page, 10) || 1 : 1,
  };

  const [snapshot, tutorResult] = await Promise.all([
    getTutorManagementSnapshot(),
    listTutors({
      search: filters.search,
      status: filters.status,
      page: filters.page,
      limit: 12,
    }),
  ]);

  const statCards = [
    {
      title: "Active tutors",
      value: snapshot.totals.activeTutors,
      trend: { value: 4, isPositive: true },
      icon: ShieldCheck,
    },
    {
      title: "Invited pipeline",
      value: snapshot.totals.invitedTutors,
      trend: { value: 12, isPositive: true },
      icon: UserPlus2,
    },
    {
      title: "Suspended",
      value: snapshot.totals.suspendedTutors,
      trend: { value: 2, isPositive: false },
      icon: ShieldX,
    },
    {
      title: "Total capacity",
      value: snapshot.totals.totalTutors,
      trend: { value: 8, isPositive: true },
      icon: Sparkles,
    },
  ] as const;

  return (
    <div className="space-y-8">
      <AdminShell
        title="Tutor operations"
        description="Control verification, publishing rights, and cohort load for every tutor."
      >
        {/* Mission control cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              trend={stat.trend}
              className="bg-gradient-to-br from-slate-900/80 via-indigo-900/50 to-slate-900/60 text-white"
            />
          ))}
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.4fr_0.8fr]">
          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Tutor roster
                </CardTitle>
                <p className="text-sm text-slate-500">
                  {tutorResult.pagination.total} professionals across the marketplace
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href="/admin/users?role=TUTOR">Invite tutor</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/admin/courses">Review courses</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <form className="grid gap-4 md:grid-cols-[2fr_1fr_0.5fr]" method="get">
                <div>
                  <Label htmlFor="search" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Search
                  </Label>
                  <Input
                    id="search"
                    name="search"
                    placeholder="Name, email, specialty"
                    className="mt-1"
                    defaultValue={filters.search}
                  />
                </div>
                <div>
                  <Label htmlFor="status" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </Label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={filters.status ?? ""}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">All statuses</option>
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option.toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full">
                    Apply
                  </Button>
                </div>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-slate-500">
                      <th className="pb-3">Tutor</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Courses</th>
                      <th className="pb-3">Activity</th>
                      <th className="pb-3">Last launch</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tutorResult.tutors.map((tutor) => (
                      <tr key={tutor.id} className="text-slate-700">
                        <td className="py-3">
                          <div className="space-y-1">
                            <p className="font-semibold">
                              {tutor.firstName} {tutor.lastName}
                            </p>
                            <p className="text-xs text-slate-500">{tutor.email}</p>
                            {tutor.profile?.headline ? (
                              <p className="text-xs text-slate-400">{tutor.profile.headline}</p>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <Badge className={statusStyles[tutor.status as UserStatus] ?? "bg-slate-100 text-slate-600"}>
                            {tutor.status.toLowerCase()}
                          </Badge>
                        </td>
                        <td>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{tutor._count?.coursesTaught ?? 0} published</p>
                            <ul className="space-y-1 text-xs text-slate-500">
                              {tutor.coursesTaught?.slice(0, 2).map((course) => (
                                <li key={course.id}>
                                  {course.title} · {course.level.toLowerCase()}
                                </li>
                              ))}
                              {(tutor.coursesTaught?.length ?? 0) === 0 && (
                                <li>No courses yet</li>
                              )}
                            </ul>
                          </div>
                        </td>
                        <td>
                          <div className="space-y-1 text-xs text-slate-500">
                            <p>{tutor._count?.enrollments ?? 0} learners</p>
                            <p>{tutor._count?.jobApplications ?? 0} job referrals</p>
                          </div>
                        </td>
                        <td>
                          <p className="text-xs text-slate-500">
                            {tutor.coursesTaught?.[0]
                              ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
                                  tutor.coursesTaught[0].createdAt,
                                )
                              : "—"}
                          </p>
                        </td>
                        <td>
                          <form action={updateTutorStatusAction} className="flex items-center gap-2">
                            <input type="hidden" name="tutorId" value={tutor.id} />
                            <select
                              name="status"
                              defaultValue={tutor.status}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                            >
                              {statusOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option.toLowerCase()}
                                </option>
                              ))}
                            </select>
                            <Button type="submit" size="sm" variant="secondary">
                              Update
                            </Button>
                          </form>
                        </td>
                      </tr>
                    ))}
                    {tutorResult.tutors.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-sm text-slate-500">
                          No tutors match the current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {tutorResult.pagination.totalPages > 1 ? (
                <div className="flex justify-center gap-2 pt-2">
                  {Array.from({ length: tutorResult.pagination.totalPages }, (_, index) => index + 1).map((page) => (
                    <Button
                      key={page}
                      variant={page === tutorResult.pagination.page ? "default" : "outline"}
                      size="sm"
                      asChild
                    >
                      <a
                        href={`?page=${page}&status=${filters.status ?? ""}&search=${encodeURIComponent(
                          filters.search ?? "",
                        )}`}
                      >
                        {page}
                      </a>
                    </Button>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border border-slate-200/70 bg-white/95">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Recent tutor launches
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {snapshot.recentTutorCourses.length === 0 && (
                  <p className="text-sm text-slate-500">No tutor-authored courses yet.</p>
                )}
                {snapshot.recentTutorCourses.map((course) => (
                  <div
                    key={course.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3"
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
                    <p className="mt-2 text-xs text-slate-500">
                      Published {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(course.createdAt)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border border-slate-200/70 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Action center</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-white/80">
                <div className="flex items-center justify-between">
                  <p>Review pending invitations</p>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {snapshot.totals.invitedTutors}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <p>Follow up on inactive tutors</p>
                  <Badge variant="outline" className="border-white/30 text-white">
                    {snapshot.totals.suspendedTutors}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <p>Assign QA partners</p>
                  <Badge variant="outline" className="border-white/30 text-white">
                    Coming soon
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminShell>
    </div>
  );
}
