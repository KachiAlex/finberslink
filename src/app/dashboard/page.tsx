import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { verifyToken } from "@/lib/auth/jwt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getStudentEnrollments, getStudentResumes, getStudentApplications } from "@/features/dashboard/service";

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

export default async function DashboardPage() {
  const user = await getUserFromSession();
  if (!user) {
    redirect("/login");
  }

  const [enrollments, resumes, applications] = await Promise.all([
    getStudentEnrollments(user.sub),
    getStudentResumes(user.sub),
    getStudentApplications(user.sub),
  ]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <header>
          <h1 className="text-3xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-slate-600">
            Welcome back. Your personalized workspace will appear here.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">My Courses</CardTitle>
              <CardDescription>Cohorts you’re enrolled in</CardDescription>
            </CardHeader>
            <CardContent>
              {enrollments.length === 0 ? (
                <p className="text-sm text-slate-500">No enrollments yet.</p>
              ) : (
                <div className="space-y-3">
                  {enrollments.slice(0, 3).map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{enrollment.course.title}</p>
                        <p className="text-xs text-slate-500 capitalize">{enrollment.course.level.toLowerCase()}</p>
                      </div>
                      <Badge variant="outline">{enrollment.progressPercentage}%</Badge>
                    </div>
                  ))}
                  {enrollments.length > 3 && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/courses">View all</Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Resume Studio</CardTitle>
              <CardDescription>AI-powered resume builder</CardDescription>
            </CardHeader>
            <CardContent>
              {resumes.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-500">Create your first resume.</p>
                  <Button size="sm" asChild>
                    <Link href="/resume/builder">Start building</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {resumes.slice(0, 2).map((resume) => (
                    <div key={resume.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{resume.title}</p>
                        <p className="text-xs text-slate-500 capitalize">{resume.visibility.toLowerCase()}</p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/resume/${resume.slug}`}>Open</Link>
                      </Button>
                    </div>
                  ))}
                  {resumes.length > 2 && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/resume">View all</Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Applications</CardTitle>
              <CardDescription>Jobs & volunteer roles</CardDescription>
            </CardHeader>
            <CardContent>
              {applications.jobs.length === 0 && applications.volunteer.length === 0 ? (
                <p className="text-sm text-slate-500">No applications yet.</p>
              ) : (
                <div className="space-y-3">
                  {[...applications.jobs.slice(0, 2), ...applications.volunteer.slice(0, 1)].map((app) => (
                    <div key={app.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {"company" in app.opportunity ? app.opportunity.title : app.opportunity.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {"company" in app.opportunity ? app.opportunity.company : app.opportunity.organization}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {app.status.toLowerCase().replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/applications">View all</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
