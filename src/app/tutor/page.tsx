import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { verifyToken } from "@/lib/auth/jwt";
import { getTutorCohorts, getPendingForumPosts, getTutorOfficeHours } from "@/features/tutor/service";
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

  const [cohorts, pendingPosts, officeHours, unreadCount] = await Promise.all([
    getTutorCohorts(user.sub),
    getPendingForumPosts(user.sub),
    getTutorOfficeHours(user.sub),
    getUnreadCount(user.sub),
  ]);

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
            <Button variant="outline" asChild>
              <Link href="/dashboard">Student view</Link>
            </Button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">My Cohorts</CardTitle>
              <CardDescription>Courses you are instructing</CardDescription>
            </CardHeader>
            <CardContent>
              {cohorts.length === 0 ? (
                <p className="text-sm text-slate-500">No cohorts assigned yet.</p>
              ) : (
                <div className="space-y-4">
                  {cohorts.map((course) => (
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
              {pendingPosts.length === 0 ? (
                <p className="text-sm text-slate-500">No pending posts.</p>
              ) : (
                <div className="space-y-3">
                  {pendingPosts.slice(0, 5).map((post) => (
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
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Office Hours</CardTitle>
            <CardDescription>Upcoming 1:1 sessions with students</CardDescription>
          </CardHeader>
          <CardContent>
            {officeHours.length === 0 ? (
              <p className="text-sm text-slate-500">No office hours scheduled.</p>
            ) : (
              <div className="space-y-4">
                {officeHours.slice(0, 3).map((session) => (
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
      </div>
    </main>
  );
}
