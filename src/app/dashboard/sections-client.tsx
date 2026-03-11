"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Skeleton } from "@/components/ui/skeleton";
import { SaveJobButton } from "@/app/jobs/_components/save-job-button";
import { GlassCardError } from "@/components/ui/glass-card-error";

interface SectionData {
  enrollments: EnrollmentSection[];
  resumes: ResumeSection[];
  applications: { jobs: ApplicationSection[]; volunteer: ApplicationSection[] };
  recommended: RecommendedJob[];
  savedIds: string[];
  insights: DashboardInsights;
}

interface SectionErrors {
  enrollments?: string | null;
  resumes?: string | null;
  applications?: string | null;
  recommended?: string | null;
  insights?: string | null;
}

interface EnrollmentSection {
  id: string;
  progressPercentage?: number | null;
  course: {
    title: string;
    slug?: string | null;
    level?: string | null;
    tagline?: string | null;
  };
}

interface ResumeSection {
  id: string;
  title: string;
  visibility: string;
  slug: string;
}

interface ApplicationSection {
  id: string;
  status: string;
  updatedAt?: string | null;
  submittedAt?: string | null;
  opportunity: {
    id?: string;
    slug?: string;
    title: string;
    company?: string;
    organization?: string;
  };
}

interface RecommendedJob {
  id: string;
  title: string;
  company: string;
  location?: string | null;
  remoteOption?: string | null;
  slug: string;
}

type SectionResponse = {
  data: SectionData;
  errors: SectionErrors;
};

export function DashboardSectionsClient() {
  const [sectionResponse, setSectionResponse] = useState<SectionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/dashboard/sections", { cache: "no-store" })
      .then((res) => res.json())
      .then((payload: SectionResponse) => {
        if (isMounted) {
          setSectionResponse(payload);
        }
      })
      .catch((error) => {
        console.error("Dashboard sections fetch failed", error);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const data = sectionResponse?.data;
  const errors = sectionResponse?.errors;
  const savedIds = new Set(data?.savedIds ?? []);

  const statusBadge = (status: string) => {
    const value = status.toLowerCase();
    if (value.includes("interview")) return "bg-indigo-50 text-indigo-700 border-indigo-100";
    if (value.includes("offer")) return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (value.includes("rejected")) return "bg-rose-50 text-rose-700 border-rose-100";
    return "bg-amber-50 text-amber-700 border-amber-100";
  };

  const renderSkeletonEntries = (count: number) => (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, idx) => (
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
  );

  const SectionError = ({ message }: { message?: string | null }) =>
    message ? (
      <GlassCardError className="mb-4" message={message} />
    ) : null;

  const accentStyles: Record<FocusCard["accent"], string> = {
    blue: "border-blue-100 bg-blue-50",
    amber: "border-amber-100 bg-amber-50",
    emerald: "border-emerald-100 bg-emerald-50",
    violet: "border-violet-100 bg-violet-50",
  };

  const renderFocusCards = () => {
    if (errors?.insights) {
      return <SectionError message={errors.insights} />;
    }

    if (loading) {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, idx) => (
            <GlassCard key={idx} className="p-0">
              <div className="space-y-3 p-4">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-9 w-28 rounded-full" />
              </div>
            </GlassCard>
          ))}
        </div>
      );
    }

    if (!data?.insights.focus.length) {
      return (
        <GlassCard className="border border-slate-200 bg-white/70 p-5 text-sm text-slate-600">
          Momentum looks good. Keep following your personalized recommendations as they appear here.
        </GlassCard>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {data.insights.focus.map((card) => (
          <GlassCard
            key={card.id}
            className={`border-2 p-5 transition hover:-translate-y-0.5 ${accentStyles[card.accent]}`}
          >
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Focus</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">{card.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{card.description}</p>
            <Button size="sm" asChild className="mt-4 rounded-full">
              <Link href={card.actionHref}>{card.actionLabel}</Link>
            </Button>
          </GlassCard>
        ))}
      </div>
    );
  };

  const renderSkillInsights = () => {
    if (errors?.insights) {
      return <SectionError message={errors.insights} />;
    }

    if (loading) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-6 w-24 rounded-full" />
            ))}
          </div>
        </div>
      );
    }

    if (!data?.insights.skills) {
      return (
        <p className="text-sm text-slate-600">
          Build at least one resume to unlock AI-powered skill insights for your target roles.
        </p>
      );
    }

    const { personaName, targetRoles, targetIndustry, highlightSkills, gapSkills, recommendation } = data.insights.skills;

    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Persona signal</p>
          <h3 className="text-xl font-semibold text-slate-900">
            {personaName || targetRoles[0] || "Your skill graph"}
          </h3>
          {(targetIndustry || targetRoles.length > 0) && (
            <p className="text-sm text-slate-600">
              Target: {targetRoles.join(" • ") || "Open"}
              {targetIndustry ? ` · ${targetIndustry}` : ""}
            </p>
          )}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Signature skills</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {highlightSkills.map((skill) => (
              <Badge key={skill} variant="secondary" className="rounded-full bg-slate-900/5 text-slate-700">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
        {!!gapSkills.length && (
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Gaps to reinforce</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {gapSkills.map((skill) => (
                <Badge key={skill} className="rounded-full bg-amber-100 text-amber-800">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <p className="text-sm text-slate-600">{recommendation}</p>
      </div>
    );
  };

  return (
    <section className="space-y-8">
      <GlassCard variant="frosted" className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="lg:w-2/3">
            <p className="text-xs uppercase tracking-[0.45em] text-slate-400">Guidance</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Personalized mission control</h2>
            <p className="text-slate-600">
              These cards prioritize the highest-leverage moves based on your enrollments, resumes, and pipeline.
            </p>
            <div className="mt-6">{renderFocusCards()}</div>
          </div>
          <GlassCard variant="bordered" className="lg:w-1/3">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.45em] text-slate-400">Skill intelligence</p>
              {renderSkillInsights()}
            </div>
          </GlassCard>
        </div>
      </GlassCard>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
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
          <SectionError message={errors?.enrollments} />
          {loading && renderSkeletonEntries(3)}
          {!loading && data?.enrollments && data.enrollments.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
              <p className="text-sm text-slate-600">
                No active cohorts. Jump into a new discipline to unlock premium tracks.
              </p>
              <Button size="sm" asChild>
                <Link href="/courses">Browse courses</Link>
              </Button>
            </div>
          )}
          {!loading && data?.enrollments && data.enrollments.length > 0 && (
            <div className="space-y-4">
              {data.enrollments.map((enrollment) => (
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
              ))}
            </div>
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
            <SectionError message={errors?.resumes} />
            {loading && renderSkeletonEntries(2)}
            {!loading && data?.resumes && data.resumes.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 space-y-3">
                <p>No resumes yet. Build your signature profile with ATS-tuned prompts.</p>
                <Button size="sm" asChild>
                  <Link href="/resume/builder">Create resume</Link>
                </Button>
              </div>
            )}
            {!loading && data?.resumes && data.resumes.length > 0 && (
              <div className="space-y-3">
                {data.resumes.map((resume) => (
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
                ))}
              </div>
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
            <SectionError message={errors?.recommended} />
            {loading && renderSkeletonEntries(3)}
            {!loading && data?.recommended && data.recommended.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 space-y-3">
                <p>No recommendations yet. Start a course or update your profile to get tailored roles.</p>
                <Button size="sm" asChild>
                  <Link href="/jobs">Browse roles</Link>
                </Button>
              </div>
            )}
            {!loading && data?.recommended && data.recommended.length > 0 && (
              <div className="space-y-3">
                {data.recommended.map((job) => (
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
                        <Link href={`/jobs/${job.slug}`}>View</Link>
                      </Button>
                      <SaveJobButton jobId={job.id} initialSaved={savedIds.has(job.id)} />
                      <Button size="sm" asChild>
                        <Link href={`/jobs/${job.slug}`}>Apply</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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
            <SectionError message={errors?.applications} />
            {loading && renderSkeletonEntries(2)}
            {!loading && data?.applications && data.applications.jobs.length + data.applications.volunteer.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 space-y-3">
                <p>No applications yet. Ready talent is one click away — browse curated roles.</p>
                <Button size="sm" asChild>
                  <Link href="/jobs">Find roles</Link>
                </Button>
              </div>
            )}
            {!loading && data?.applications && (
              <div className="space-y-4">
                {[...data.applications.jobs.slice(0, 2), ...data.applications.volunteer.slice(0, 1)].map((app) => (
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
                          Last updated: {app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : "—"}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`border text-xs font-medium uppercase tracking-wide ${statusBadge(app.status)}`}
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
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
