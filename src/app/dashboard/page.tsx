import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import {
  getStudentApplications,
  getStudentEnrollments,
  getStudentResumes,
} from "@/features/dashboard/service";
import { listRecommendedJobs } from "@/features/dashboard/service";
import { listSavedJobs } from "@/features/jobs/service";
import { SaveJobButton } from "../jobs/_components/save-job-button";
import { verifyToken } from "@/lib/auth/jwt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { ArrowRight, Briefcase, GraduationCap, MessageSquare, Sparkles } from "lucide-react";
import { getUnreadCount } from "@/features/notifications/service";
import { Skeleton } from "@/components/ui/skeleton";

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

  const cachedRecommendations = unstable_cache(() => listRecommendedJobs(5), ["recommended-jobs"], {
    revalidate: 60,
  });

  const [enrollmentsResult, resumesResult, applicationsResult, unreadResult, recommendedResult, savedResult] = await Promise.allSettled([
    getStudentEnrollments(user.sub),
    getStudentResumes(user.sub),
    getStudentApplications(user.sub),
    getUnreadCount(user.sub),
    cachedRecommendations(),
    listSavedJobs(user.sub),
  ]);

  const sectionErrors: Record<string, string | null> = {
    enrollments: enrollmentsResult.status === "rejected" ? "Courses unavailable" : null,
    resumes: resumesResult.status === "rejected" ? "Resumes unavailable" : null,
    applications: applicationsResult.status === "rejected" ? "Applications unavailable" : null,
    recommended: recommendedResult.status === "rejected" ? "Recommendations unavailable" : null,
  };

  const safeEnrollments = enrollmentsResult.status === "fulfilled" ? enrollmentsResult.value ?? [] : [];
  const safeResumes = resumesResult.status === "fulfilled" ? resumesResult.value ?? [] : [];
  const safeApplications = applicationsResult.status === "fulfilled" ? applicationsResult.value ?? { jobs: [], volunteer: [] } : { jobs: [], volunteer: [] };
  const safeRecommended = recommendedResult.status === "fulfilled" ? recommendedResult.value ?? [] : [];
  const savedIds = new Set(
    savedResult.status === "fulfilled"
      ? (savedResult.value ?? []).map((save: any) => save.jobOpportunityId)
      : [],
  );
  const unreadCount = unreadResult.status === "fulfilled" ? unreadResult.value ?? 0 : 0;

  const totalApplications = safeApplications.jobs.length + safeApplications.volunteer.length;
  const activeCourses = safeEnrollments.length;
  const resumeCount = safeResumes.length;

  const SectionError = ({ message }: { message: string | null }) =>
    message ? (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{message}</div>
    ) : null;

  const isLoading = false;

  const statusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("interview")) return "bg-indigo-50 text-indigo-700 border-indigo-100";
    if (s.includes("offer")) return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (s.includes("rejected")) return "bg-rose-50 text-rose-700 border-rose-100";
    return "bg-amber-50 text-amber-700 border-amber-100";
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900">
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-br from-blue-100/70 via-white to-cyan-50 blur-2xl" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
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
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-sm">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <span>Messages</span>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                  {unreadCount}
                </Badge>
              </div>
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
              <SectionError message={sectionErrors.enrollments} />
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4"
                    >
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-8 w-20 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : safeEnrollments.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                  <p className="text-sm text-slate-600">
                    No active cohorts. Jump into a new discipline to unlock premium tracks.
                  </p>
                  <Button size="sm" asChild>
                    <Link href="/courses">Browse courses</Link>
                  </Button>
                </div>
              ) : (
                safeEnrollments.slice(0, 4).map((enrollment: any) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4"
                  >
                    <div>
                      <p className="text-base font-semibold text-slate-900">{enrollment.course.title}</p>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        {enrollment.course.level?.toLowerCase() ?? "self-paced"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                        {enrollment.course.tagline ?? "Continue your momentum"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <ProgressRing value={enrollment.progressPercentage ?? 0} />
                        <span className="text-sm font-medium text-slate-600">
                          {enrollment.progressPercentage ?? 0}% mastery
                        </span>
                      </div>
                      <Button size="sm" asChild className="rounded-full">
                        <Link href={`/courses/${enrollment.course.slug ?? enrollment.course.id}`}>
                          Continue
                        </Link>
                      </Button>
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
                <SectionError message={sectionErrors.resumes} />
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-8 w-16 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : safeResumes.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 space-y-3">
                    <p>No resumes yet. Build your signature profile with ATS-tuned prompts.</p>
                    <Button size="sm" asChild>
                      <Link href="/resume/builder">Create resume</Link>
                    </Button>
                  </div>
                ) : (
                  safeResumes.slice(0, 3).map((resume: any) => (
                    <div
                      key={resume.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{resume.title}</p>
                        <p className="text-xs text-slate-500 capitalize">
                          Visibility: {resume.visibility.toLowerCase()}
                        </p>
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
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Recommended</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-900">Roles curated for you</h2>
                  <p className="text-slate-600">Based on your enrollments and recent activity</p>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-slate-600 hover:bg-slate-100">
                  <Link href="/jobs">See all</Link>
                </Button>
              </div>

              <div className="mt-6 space-y-3">
                <SectionError message={sectionErrors.recommended} />
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-8 w-20 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : safeRecommended.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 space-y-3">
                    <p>No recommendations yet. Start a course or update your profile to get tailored roles.</p>
                    <Button size="sm" asChild>
                      <Link href="/jobs">Browse roles</Link>
                    </Button>
                  </div>
                ) : (
                  safeRecommended.map((job: any) => (
                    <div
                      key={job.id}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">{job.title}</p>
                        <p className="text-xs text-slate-500">
                          {job.company} · {job.location ?? job.remoteOption ?? "Remote-friendly"}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {job.remoteOption && (
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                              {job.remoteOption}
                            </Badge>
                          )}
                          {job.location && (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                              {job.location}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" asChild className="text-slate-600 hover:bg-slate-100">
                          <Link href={`/jobs/${job.id}`}>View</Link>
                        </Button>
                        <SaveJobButton jobId={job.id} initialSaved={savedIds.has(job.id)} />
                        <Button size="sm" asChild>
                          <Link href={`/jobs/${job.id}`}>Apply</Link>
                        </Button>
                      </div>
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
                <SectionError message={sectionErrors.applications} />
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : totalApplications === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 space-y-3">
                    <p>No applications yet. Ready talent is one click away — browse curated roles.</p>
                    <Button size="sm" asChild>
                      <Link href="/jobs">Find roles</Link>
                    </Button>
                  </div>
                ) : (
                  [...safeApplications.jobs.slice(0, 2), ...safeApplications.volunteer.slice(0, 1)].map((app: any) => (
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
                          <p className="text-[11px] text-slate-400">
                            Last updated:{" "}
                            {app.updatedAt
                              ? new Date(app.updatedAt).toLocaleDateString()
                              : app.submittedAt
                                ? new Date(app.submittedAt).toLocaleDateString()
                                : "—"}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`border text-xs font-medium uppercase tracking-wide ${statusBadge(
                            app.status
                          )}`}
                        >
                          {app.status.toLowerCase().replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button size="sm" variant="ghost" asChild className="text-slate-600 hover:bg-slate-100">
                          <Link href={`/applications/${app.id}`}>View</Link>
                        </Button>
                        <Button size="sm" asChild>
                          <Link href={`/jobs/${app.opportunity.id ?? app.opportunity.slug ?? ""}`}>Revisit role</Link>
                        </Button>
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
