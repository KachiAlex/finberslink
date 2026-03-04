import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, CircleDashed, MessageSquare, PenSquare, Plus } from "lucide-react";
import { verifyToken } from "@/lib/auth/jwt";
import {
  getTutorCohorts,
  getPendingForumPosts,
  getTutorOfficeHours,
  getTutorForumThreads,
  listTutorExams,
} from "@/features/tutor/service";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import { getUnreadCount } from "@/features/notifications/service";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getUserFromSession() {
  const store = await cookies();
  const accessToken = store.get("access_token")?.value;
  if (!accessToken) return null;
  try {
    return verifyToken(accessToken);
  } catch {
    return null;
  }
}

export default async function TutorPage() {
  const user = await getUserFromSession();
  if (!user || user.role !== "TUTOR") {
    redirect("/dashboard");
  }

  let dashboardError: unknown = null;
  let cohorts: any[] = [];
  let pendingPosts: any[] = [];
  let officeHours: any[] = [];
  let unreadCount = 0;
  let exams: any[] = [];
  let forumThreads: any[] = [];

  try {
    [cohorts, pendingPosts, officeHours, unreadCount, exams, forumThreads] = await Promise.all([
      getTutorCohorts(user.sub),
      getPendingForumPosts(user.sub),
      getTutorOfficeHours(user.sub),
      getUnreadCount(user.sub),
      listTutorExams(user.sub),
      getTutorForumThreads(user.sub, 5),
    ]);
  } catch (err) {
    console.error("Failed to load tutor dashboard", err);
    dashboardError = err;
  }

  const DashboardError = ({ label, error }: { label: string; error?: unknown }) => {
    if (!error) return null;
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <p className="font-semibold">{label}</p>
        <p className="text-xs text-red-600">We couldn’t load this section. Try reloading.</p>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Tutor Dashboard</h1>
            <p className="text-slate-600">Manage your cohorts, lessons, and student engagement.</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationsBell unreadCount={unreadCount} />
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">My Cohorts</CardTitle>
                <CardDescription>Courses you are instructing</CardDescription>
              </div>
              <Button asChild>
                <Link href="/tutor/courses/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create course
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <DashboardError label="Cohorts unavailable" error={dashboardError} />
              {cohorts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <p>No cohorts yet. Start by proposing a course and outlining its sections.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cohorts.map((course: any) => (
                    <div key={course.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-slate-900">{course.title}</h3>
                        <Badge variant="outline">{course.enrollments.length} students</Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{course.category}</p>
                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <span>{course.lessons.length} lessons</span>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/tutor/cohort/${course.slug}`}>Manage</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Forum Moderation</CardTitle>
              <CardDescription>Posts pending your review</CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardError label="Forum posts unavailable" error={dashboardError} />
              {pendingPosts.length === 0 ? (
                <p className="text-sm text-slate-500">No pending posts.</p>
              ) : (
                <div className="space-y-3">
                  {pendingPosts.slice(0, 5).map((post: any) => (
                    <div key={post.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{post.title}</p>
                        <p className="text-xs text-slate-500">
                          {post.author.firstName} {post.author.lastName} · {post.course.title}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/tutor/forum/${post.id}`}>Review</Link>
                      </Button>
                    </div>
                  ))}
                  {pendingPosts.length > 5 && (
                    <Button variant="ghost" size="sm" className="w-full">
                      View all {pendingPosts.length} pending posts
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border border-slate-200/70 bg-white/95">
          <CardHeader className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Exams & assessments</CardTitle>
              <CardDescription>Build per-section or final exams and submit for approval.</CardDescription>
            </div>
            <Button asChild>
              <Link href="/tutor/exams/new">
                <PenSquare className="mr-2 h-4 w-4" />
                Create exam
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <DashboardError label="Exams unavailable" error={dashboardError} />
            {exams.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                No exams yet. Start by choosing a course section or final exam target, then add modules and submit for admin approval.
              </div>
            ) : (
              <div className="space-y-3">
                {exams.slice(0, 5).map((exam: any) => {
                  const statusColor =
                    exam.status === "APPROVED"
                      ? "bg-emerald-50 text-emerald-700"
                      : exam.status === "SUBMITTED"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-slate-100 text-slate-700";
                  const statusIcon =
                    exam.status === "APPROVED" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : exam.status === "SUBMITTED" ? (
                      <ArrowRight className="h-4 w-4" />
                    ) : (
                      <CircleDashed className="h-4 w-4" />
                    );
                  return (
                    <div
                      key={exam.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">{exam.title}</p>
                        <p className="text-xs text-slate-500">
                          Target: {exam.target} · Updated {exam.updatedAt}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={statusColor + " flex items-center gap-1"}>
                          {statusIcon}
                          <span className="capitalize">{exam.status.toLowerCase()}</span>
                        </Badge>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/tutor/exams/${exam.id}`}>Open</Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200/70 bg-white/95">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Office Hours</CardTitle>
            <CardDescription>Upcoming 1:1 sessions with students</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardError label="Office hours unavailable" error={dashboardError} />
            {officeHours.length === 0 ? (
              <p className="text-sm text-slate-500">No office hours scheduled.</p>
            ) : (
              <div className="space-y-4">
                {officeHours.slice(0, 3).map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {session.startTime.toLocaleDateString()} · {session.startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-xs text-slate-500">
                        {session.bookings.length} student{session.bookings.length !== 1 ? "s" : ""} booked
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/tutor/office-hours/${session.id}`}>Manage</Link>
                    </Button>
                  </div>
                ))}
                {officeHours.length > 3 && (
                  <Button variant="ghost" size="sm" className="w-full">
                    View all sessions
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200/70 bg-white/95">
          <CardHeader className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Messages & forums</CardTitle>
              <CardDescription>Stay close to student questions and threads.</CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/tutor/messages">
                <MessageSquare className="mr-2 h-4 w-4" />
                Open inbox
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <DashboardError label="Messages unavailable" error={dashboardError} />
            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <span>Unread messages</span>
              <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                {unreadCount}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Recent forums</p>
              {forumThreads.length === 0 ? (
                <p className="text-sm text-slate-500">No recent threads.</p>
              ) : (
                <div className="space-y-2">
                  {forumThreads.map((thread: any) => (
                    <div
                      key={thread.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{thread.title}</p>
                        <p className="text-xs text-slate-500">{thread.course?.title ?? "Course"}</p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/forum/thread/${thread.id}`}>Open</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button className="w-full" variant="outline" asChild>
                <Link href="/forum">View course forums</Link>
              </Button>
              <Button className="w-full" asChild>
                <Link href="/forum/new">Create forum thread</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
