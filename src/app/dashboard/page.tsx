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
    <main className="relative min-h-screen overflow-hidden bg-[#04050d] text-white">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(76,76,255,0.15),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(255,94,188,0.15),_transparent_45%)]" />
        <div className="absolute inset-0 opacity-30 mix-blend-screen">
          <div className="h-full w-full bg-[linear-gradient(120deg,_rgba(255,255,255,0.06)_1px,_transparent_1px),_linear-gradient(240deg,_rgba(255,255,255,0.04)_1px,_transparent_1px)] bg-[length:140px_140px]" />
        </div>
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-white/60">Finbers Link</p>
              <h1 className="mt-2 text-4xl font-semibold text-white sm:text-5xl">
                Your Career Command Center
              </h1>
            </div>
            <Button
              asChild
              className="rounded-full bg-white/10 px-5 text-white shadow-[0_0_30px_rgba(79,70,229,0.35)] transition hover:bg-white/20"
            >
              <Link href="/dashboard/applications" className="flex items-center gap-2 text-sm font-medium">
                Quick Apply <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="max-w-2xl text-base text-white/70">
            Track your learning velocity, craft high-converting resumes, and manage every application
            from a single, high-fidelity cockpit.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Active Learning Tracks"
            value={activeCourses}
            icon={GraduationCap}
            trend={{ value: 18, isPositive: true }}
            className="bg-gradient-to-br from-[#6f6bff]/20 via-white/5 to-transparent"
          />
          <StatCard
            title="Resumes in Studio"
            value={resumeCount}
            icon={Sparkles}
            trend={{ value: 32, isPositive: true }}
            className="bg-gradient-to-br from-[#ff5ebc]/20 via-white/5 to-transparent"
          />
          <StatCard
            title="Opportunities in Motion"
            value={totalApplications}
            icon={Briefcase}
            trend={{ value: 12, isPositive: true }}
            className="bg-gradient-to-br from-[#2dd4bf]/20 via-white/5 to-transparent"
          />
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-white/60">Learning arc</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">My Courses</h2>
                <p className="text-white/70">Cohorts currently shaping your skill trajectory</p>
              </div>
              <Button variant="secondary" asChild className="rounded-full bg-white/10 text-white hover:bg-white/20">
                <Link href="/courses">Explore tracks</Link>
              </Button>
            </div>

            <div className="mt-8 space-y-4">
              {enrollments.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-white/70">
                    No active cohorts. Jump into a new discipline to unlock premium tracks.
                  </p>
                </div>
              ) : (
                enrollments.slice(0, 4).map((enrollment: any) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 to-transparent px-5 py-4"
                  >
                    <div>
                      <p className="text-base font-semibold text-white">{enrollment.course.title}</p>
                      <p className="text-xs uppercase tracking-wide text-white/60">
                        {enrollment.course.level.toLowerCase()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <ProgressRing value={enrollment.progressPercentage} />
                      <span className="text-sm font-medium text-white/80">
                        {enrollment.progressPercentage}% mastery
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>

          <div className="space-y-8">
            <GlassCard className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-white/60">Resume studio</p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">AI-grade resumes</h2>
                  <p className="text-white/70">Hand off a polished narrative every time</p>
                </div>
                <Button asChild variant="default" className="rounded-full bg-white text-slate-900 shadow-lg">
                  <Link href="/resume/builder">Launch studio</Link>
                </Button>
              </div>

              <div className="mt-6 space-y-3">
                {resumes.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                    No resumes yet. Build your signature profile with ATS-tuned prompts.
                  </div>
                ) : (
                  resumes.slice(0, 3).map((resume: any) => (
                    <div
                      key={resume.id}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{resume.title}</p>
                        <p className="text-xs text-white/60 capitalize">{resume.visibility.toLowerCase()}</p>
                      </div>
                      <Button variant="ghost" size="sm" asChild className="text-white/80 hover:bg-white/10">
                        <Link href={`/resume/${resume.slug}`}>Preview</Link>
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-white/60">Pipeline</p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">Applications</h2>
                  <p className="text-white/70">Opportunities currently in play</p>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-white/80 hover:bg-white/10">
                  <Link href="/applications">See all</Link>
                </Button>
              </div>

              <div className="mt-6 space-y-4">
                {totalApplications === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                    No applications yet. Ready talent is one click away — browse curated roles.
                  </div>
                ) : (
                  [...applications.jobs.slice(0, 2), ...applications.volunteer.slice(0, 1)].map((app: any) => (
                    <div
                      key={app.id}
                      className="rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 to-transparent p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">{app.opportunity.title}</p>
                          <p className="text-xs text-white/60">
                            {"company" in app.opportunity ? app.opportunity.company : app.opportunity.organization}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-white/30 bg-white/5 text-xs font-medium uppercase tracking-wide text-white"
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
