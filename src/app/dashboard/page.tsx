import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  getStudentApplications,
  getStudentEnrollments,
  getStudentResumes,
} from "@/features/dashboard/service";
import { verifyToken } from "@/lib/auth/jwt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { ArrowRight, Briefcase, GraduationCap, Sparkles } from "lucide-react";

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

  const totalApplications = applications.jobs.length + applications.volunteer.length;
  const activeCourses = enrollments.length;
  const resumeCount = resumes.length;

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900">
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-br from-blue-100/70 via-white to-cyan-50 blur-2xl" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
        <header className="rounded-4xl relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg shadow-slate-200/70">
          <div className="absolute -right-16 top-6 h-48 w-48 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-400/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.45em] text-slate-500">Finbers Link</p>
              <h1 className="mt-3 text-4xl font-semibold text-slate-900 sm:text-5xl">
                Your career command center
              </h1>
              <p className="mt-3 max-w-2xl text-base text-slate-600">
                Track your learning velocity, craft high-converting resumes, and manage every application from a single,
                high-fidelity cockpit.
              </p>
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
              <Button
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-100"
                asChild
              >
                <Link href="/courses" className="flex items-center gap-2">
                  Explore tracks
                </Link>
              </Button>
              <Button
                asChild
                className="rounded-full bg-slate-900 px-5 text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800"
              >
                <Link href="/dashboard/applications" className="flex items-center gap-2 text-sm font-medium">
                  Quick apply <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Active Learning Tracks"
            value={activeCourses}
            icon={GraduationCap}
            trend={{ value: 18, isPositive: true }}
            variant="minimal"
          />
          <StatCard
            title="Resumes in Studio"
            value={resumeCount}
            icon={Sparkles}
            trend={{ value: 32, isPositive: true }}
            variant="minimal"
          />
          <StatCard
            title="Opportunities in Motion"
            value={totalApplications}
            icon={Briefcase}
            trend={{ value: 12, isPositive: true }}
            variant="minimal"
          />
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <GlassCard variant="bordered" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Learning arc</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">My courses</h2>
                <p className="text-slate-600">Cohorts currently shaping your skill trajectory</p>
              </div>
              <Button variant="outline" asChild className="rounded-full border-slate-200 text-slate-700 hover:bg-slate-100">
                <Link href="/courses">Explore tracks</Link>
              </Button>
            </div>

            <div className="mt-8 space-y-4">
              {enrollments.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">
                    No active cohorts. Jump into a new discipline to unlock premium tracks.
                  </p>
                </div>
              ) : (
                enrollments.slice(0, 4).map((enrollment: any) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4"
                  >
                    <div>
                      <p className="text-base font-semibold text-slate-900">{enrollment.course.title}</p>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        {enrollment.course.level.toLowerCase()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <ProgressRing value={enrollment.progressPercentage} />
                      <span className="text-sm font-medium text-slate-600">
                        {enrollment.progressPercentage}% mastery
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>

          <div className="space-y-8">
            <GlassCard variant="bordered" className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Resume studio</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-900">AI-grade resumes</h2>
                  <p className="text-slate-600">Hand off a polished narrative every time</p>
                </div>
                <Button asChild variant="default" className="rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800">
                  <Link href="/resume/builder">Launch studio</Link>
                </Button>
              </div>

              <div className="mt-6 space-y-3">
                {resumes.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    No resumes yet. Build your signature profile with ATS-tuned prompts.
                  </div>
                ) : (
                  resumes.slice(0, 3).map((resume: any) => (
                    <div
                      key={resume.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{resume.title}</p>
                        <p className="text-xs text-slate-500 capitalize">{resume.visibility.toLowerCase()}</p>
                      </div>
                      <Button variant="ghost" size="sm" asChild className="text-slate-600 hover:bg-slate-100">
                        <Link href={`/resume/${resume.slug}`}>Preview</Link>
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>

            <GlassCard variant="bordered" className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Pipeline</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-900">Applications</h2>
                  <p className="text-slate-600">Opportunities currently in play</p>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-slate-600 hover:bg-slate-100">
                  <Link href="/applications">See all</Link>
                </Button>
              </div>

              <div className="mt-6 space-y-4">
                {totalApplications === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    No applications yet. Ready talent is one click away — browse curated roles.
                  </div>
                ) : (
                  [...applications.jobs.slice(0, 2), ...applications.volunteer.slice(0, 1)].map((app: any) => (
                    <div
                      key={app.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{app.opportunity.title}</p>
                          <p className="text-xs text-slate-500">
                            {"company" in app.opportunity ? app.opportunity.company : app.opportunity.organization}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-600"
                        >
                          {app.status.toLowerCase().replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          </div>
        </section>
      </div>
    </main>
  );
}
