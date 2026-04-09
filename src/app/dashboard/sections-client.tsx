"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Briefcase, MapPin, Calendar, Filter, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassCardError } from "@/components/ui/glass-card-error";
import { Skeleton } from "@/components/ui/skeleton";
import { JobBrowserButton } from "@/components/jobs/job-browser-button";
import { DashboardCoursesTab } from "@/components/dashboard/dashboard-courses-tab";
import { EnhancedCoursesTab } from "@/components/dashboard/enhanced-courses-tab";
import { ImportResumeModal } from "@/components/resume/import-resume-modal";

interface EnrollmentSection {
  id: string;
  progressPercentage?: number | null;
  course: {
    id: string;
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
  shareSlug?: string | null;
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

type FocusCard = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  accent: "blue" | "amber" | "emerald" | "violet";
};

type SkillInsights = {
  personaName?: string | null;
  targetRoles: string[];
  targetIndustry?: string | null;
  highlightSkills: string[];
  gapSkills: string[];
  recommendation: string;
};

type DashboardInsights = {
  focus: FocusCard[];
  skills: SkillInsights | null;
};

type DashboardSummary = {
  enrollmentsCount: number;
  completedEnrollmentsCount: number;
  resumesCount: number;
  applicationsCount: number;
  jobApplicationsCount: number;
  volunteerApplicationsCount: number;
  resumeViewsCount: number;
};

interface SectionData {
  summary: DashboardSummary | null;
  enrollments: EnrollmentSection[];
  resumes: ResumeSection[];
  applications: { jobs: ApplicationSection[]; volunteer: ApplicationSection[] };
  recommended: RecommendedJob[];
  savedIds: string[];
  insights: DashboardInsights;
}

interface SectionErrors {
  summary?: string | null;
  enrollments?: string | null;
  resumes?: string | null;
  applications?: string | null;
  recommended?: string | null;
  insights?: string | null;
}

export type SectionResponse = {
  data: SectionData;
  errors: SectionErrors;
  meta?: {
    mode: "fast" | "full";
    cached?: boolean;
    generatedAt: string;
    timings: {
      summaryMs: number;
      enrollmentsMs: number;
      resumesMs: number;
      applicationsMs: number;
      recommendedMs: number;
      savedIdsMs: number;
      insightsMs: number;
    };
  };
};

interface DashboardSectionsClientProps {
  sectionResponse?: SectionResponse | null;
  loading?: boolean;
}

type Metric = {
  label: string;
  value: string | number;
  helper: string;
  action: string;
};

type HighlightStat = {
  title: string;
  value: string | number;
  helper: string;
};

function getTimingBadgeClass(durationMs: number) {
  if (durationMs <= 250) {
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }

  if (durationMs <= 700) {
    return "bg-amber-100 text-amber-800 border-amber-200";
  }

  return "bg-rose-100 text-rose-800 border-rose-200";
}

function getCriticalTimingWarnings(meta?: SectionResponse["meta"]) {
  if (!meta) {
    return [] as string[];
  }

  const warnings: string[] = [];
  const { timings } = meta;

  if (timings.insightsMs > 1000) {
    warnings.push(`Insights is slow (${timings.insightsMs}ms)`);
  }

  if (timings.summaryMs > 800) {
    warnings.push(`Summary is slow (${timings.summaryMs}ms)`);
  }

  if (timings.applicationsMs > 900) {
    warnings.push(`Applications is slow (${timings.applicationsMs}ms)`);
  }

  return warnings;
}

const LOADING_METRICS: Metric[] = [
  { label: "Courses enrolled", value: "—", helper: "Loading", action: "/dashboard/courses" },
  { label: "Courses completed", value: "—", helper: "Loading", action: "/dashboard/courses" },
  { label: "Resumes created", value: "—", helper: "Loading", action: "/dashboard/resumes" },
  { label: "Resume views", value: "—", helper: "Loading", action: "/dashboard/resumes" },
  { label: "Jobs applied", value: "—", helper: "Loading", action: "/dashboard/jobs" },
  { label: "Volunteer apps", value: "—", helper: "Loading", action: "/dashboard/jobs" },
];

const LOADING_HIGHLIGHTS: HighlightStat[] = [
  { title: "Career momentum", value: "—", helper: "Loading" },
  { title: "Completed tracks", value: "—", helper: "Loading" },
  { title: "Profile reach", value: "—", helper: "Loading" },
];

export function DashboardSectionsClient({
  sectionResponse: externalSectionResponse,
  loading: externalLoading,
}: DashboardSectionsClientProps = {}) {
  const [internalSectionResponse, setInternalSectionResponse] = useState<SectionResponse | null>(null);
  const [internalLoading, setInternalLoading] = useState(true);

  const isExternallyControlled =
    externalSectionResponse !== undefined || externalLoading !== undefined;
  const sectionResponse =
    externalSectionResponse !== undefined ? externalSectionResponse : internalSectionResponse;
  const loading = externalLoading !== undefined ? externalLoading : internalLoading;

  useEffect(() => {
    if (isExternallyControlled) {
      return;
    }

    let isMounted = true;

    const loadSections = async () => {
      try {
        const res = await fetch("/api/dashboard/sections?mode=fast", { cache: "no-store" });
        if (!res.ok) {
          console.error("Failed to fetch dashboard sections:", res.status);
          setInternalSectionResponse(null);
          return;
        }
        const payload = (await res.json()) as SectionResponse;
        if (isMounted) {
          setInternalSectionResponse(payload);
        }
      } catch (error) {
        console.error("Dashboard sections fetch failed", error);
        if (isMounted) {
          setInternalSectionResponse(null);
        }
      } finally {
        if (isMounted) {
          setInternalLoading(false);
        }
      }
    };

    void loadSections();

    return () => {
      isMounted = false;
    };
  }, [isExternallyControlled]);

  const data = sectionResponse?.data;
  const errors = sectionResponse?.errors;
  const meta = sectionResponse?.meta;
  const criticalWarnings = useMemo(() => getCriticalTimingWarnings(meta), [meta]);
  const summary = data?.summary;

  const activeCourses = data?.enrollments.length ?? 0;
  const resumesCount = data?.resumes.length ?? 0;
  const applicationsCount =
    (data?.applications.jobs.length ?? 0) + (data?.applications.volunteer.length ?? 0);

  const quickSummary = useMemo(() => {
    if (loading) {
      return "We're collecting your latest stats";
    }

    if (!data) {
      return "Stay tuned—your learning signals will appear here.";
    }

    const applicationTotal = data.applications.jobs.length + data.applications.volunteer.length;
    return `${data.enrollments.length || "No"} active course${data.enrollments.length === 1 ? "" : "s"}, ${
      data.resumes.length || "no"
    } resume${data.resumes.length === 1 ? "" : "s"}, ${
      applicationTotal || "no"
    } application${applicationTotal === 1 ? "" : "s"} in motion.`;
  }, [data, loading]);

  // Overview section - Your current status
  const overviewTitle = "Your current status.";
  const overviewLabel = "OVERVIEW";

  const metrics = useMemo<Metric[]>(
    () => {
      if (!summary) {
        return LOADING_METRICS;
      }

      return [
        {
          label: "Courses enrolled",
          value: loading ? "—" : summary.enrollmentsCount ?? activeCourses,
          helper: activeCourses ? "Keep your streak alive" : "Start a track to unlock guidance",
          action: "/dashboard/courses",
        },
        {
          label: "Courses completed",
          value: loading ? "—" : summary.completedEnrollmentsCount ?? 0,
          helper:
            (summary.completedEnrollmentsCount ?? 0) > 0
              ? "Celebrate milestones"
              : "Finish a course to unlock certificates",
          action: "/dashboard/courses",
        },
        {
          label: "Resumes created",
          value: loading ? "—" : summary.resumesCount ?? resumesCount,
          helper: resumesCount ? "Refresh insights anytime" : "Generate an ATS-ready resume",
          action: "/dashboard/resumes",
        },
        {
          label: "Resume views",
          value: loading ? "—" : summary.resumeViewsCount ?? 0,
          helper:
            (summary.resumeViewsCount ?? 0) > 0
              ? "People are checking you out"
              : "Share your profile link to gain traction",
          action: "/dashboard/resumes",
        },
        {
          label: "Jobs applied",
          value: loading ? "—" : summary.jobApplicationsCount ?? 0,
          helper: applicationsCount ? "Track responses in dashboard" : "Submit at least one this week",
          action: "/dashboard/jobs",
        },
        {
          label: "Volunteer apps",
          value: loading ? "—" : summary.volunteerApplicationsCount ?? 0,
          helper:
            (summary.volunteerApplicationsCount ?? 0) > 0
              ? "Stay close to your mission goals"
              : "Volunteer work boosts resumes",
          action: "/dashboard/jobs",
        },
      ];
    },
    [activeCourses, applicationsCount, loading, resumesCount, summary]
  );

  const highlightStats = useMemo<HighlightStat[]>(
    () => {
      if (!summary) {
        return LOADING_HIGHLIGHTS;
      }

      return [
        {
          title: "Career momentum",
          value: loading ? "—" : summary.applicationsCount ?? applicationsCount,
          helper: "Total applications across jobs & volunteer roles",
        },
        {
          title: "Completed tracks",
          value: loading ? "—" : summary.completedEnrollmentsCount ?? 0,
          helper: "Courses fully mastered",
        },
        {
          title: "Profile reach",
          value: loading ? "—" : summary.resumeViewsCount ?? 0,
          helper: "Public resume impressions",
        },
      ];
    },
    [applicationsCount, loading, summary]
  );

  const topCourse = data?.enrollments[0];
  const topApplication = data?.applications.jobs[0] ?? data?.applications.volunteer[0];
  const featuredFocus = data?.insights.focus[0];
  const skillInsight = data?.insights.skills;
  const featuredJob = data?.recommended[0];

  const renderLatestCourse = () => {
    if (errors?.enrollments) {
      return <GlassCardError message={errors.enrollments} />;
    }

    if (!topCourse) {
      return (
        <div className="space-y-3 text-sm text-slate-600">
          <p>No active courses right now.</p>
          <Button size="sm" asChild>
            <Link href="/dashboard/courses">Browse catalog</Link>
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Latest course</p>
          <h3 className="text-lg font-semibold text-slate-900">{topCourse.course.title}</h3>
          <p className="text-sm text-slate-500">{topCourse.course.tagline ?? "Keep shipping lessons"}</p>
        </div>
          <Button asChild size="sm" className="rounded-full">
          <Link href={`/courses/${topCourse.course.id}`}>Continue course</Link>
        </Button>
      </div>
    );
  };

  const renderPipelineHighlight = () => {
    if (errors?.applications) {
      return <GlassCardError message={errors.applications} />;
    }

    if (!topApplication) {
      return (
        <div className="space-y-3 text-sm text-slate-600">
          <p>No applications in play.</p>
          <Button size="sm" asChild variant="secondary">
            <Link href="/dashboard/jobs">Browse roles</Link>
          </Button>
        </div>
      );
    }

    const opportunityCompany = topApplication.opportunity.company ?? topApplication.opportunity.organization ?? "";

    return (
      <div className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Pipeline</p>
          <h3 className="text-lg font-semibold text-slate-900">{topApplication.opportunity.title}</h3>
          <p className="text-sm text-slate-500">{opportunityCompany}</p>
          <p className="text-xs text-slate-400">
            Last touch {topApplication.updatedAt
              ? new Date(topApplication.updatedAt).toLocaleDateString()
              : topApplication.submittedAt
                ? new Date(topApplication.submittedAt).toLocaleDateString()
                : "recently"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" asChild className="text-slate-600">
            <Link href='/dashboard/jobs'>View</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/jobs/${topApplication.opportunity.slug ?? topApplication.opportunity.id ?? ""}`}>
              Review role
            </Link>
          </Button>
        </div>
      </div>
    );
  };

  const renderFocusHighlight = () => {
    if (errors?.insights) {
      return <GlassCardError message={errors.insights} />;
    }

    if (featuredFocus) {
      return (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Recommendation</p>
          <h3 className="text-lg font-semibold text-slate-900">{featuredFocus.title}</h3>
          <p className="text-sm text-slate-500">{featuredFocus.description}</p>
          <Button size="sm" asChild>
            <Link href={featuredFocus.actionHref}>{featuredFocus.actionLabel}</Link>
          </Button>
        </div>
      );
    }

    if (skillInsight) {
      return (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Skills focus</p>
          <h3 className="text-lg font-semibold text-slate-900">
            {skillInsight.personaName ?? skillInsight.targetRoles[0] ?? "Your skill graph"}
          </h3>
          <div className="flex flex-wrap gap-2">
            {skillInsight.highlightSkills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="secondary" className="rounded-full bg-slate-900/5 text-slate-700">
                {skill}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-slate-500">{skillInsight.recommendation}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3 text-sm text-slate-600">
        <p>Build a resume to unlock AI insights tailored to your target roles.</p>
        <Button size="sm" asChild>
          <Link href="/dashboard/resumes">Create resume</Link>
        </Button>
      </div>
    );
  };

  const renderJobHighlight = () => {
    if (errors?.recommended) {
      return <GlassCardError message={errors.recommended} />;
    }

    if (!featuredJob) {
      return (
        <div className="space-y-3 text-sm text-slate-600">
          <p>No tailored roles yet. Update your profile or enroll in a course to unlock matches.</p>
          <Button size="sm" variant="secondary" asChild>
            <Link href="/dashboard/jobs">Browse roles</Link>
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Recommended role</p>
          <h3 className="text-lg font-semibold text-slate-900">{featuredJob.title}</h3>
          <p className="text-sm text-slate-500">
            {featuredJob.company} · {featuredJob.location ?? featuredJob.remoteOption ?? "Remote friendly"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" asChild className="text-slate-600">
            <Link href={`/jobs/${featuredJob.slug}`}>View</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/jobs/${featuredJob.slug}`}>Apply</Link>
          </Button>
        </div>
      </div>
    );
  };

  const renderInsightsTab = () => {
    if (loading && !data) {
      return <InsightsTabSkeleton />;
    }

    return (
      <div className="space-y-6">
        <GlassCard variant="gradient" className="space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Insights &amp; Guidance</p>
              <h3 className="text-2xl font-semibold text-slate-900">Your next best moves</h3>
              <p className="text-sm text-slate-600">{quickSummary}</p>
            </div>
            <Button asChild size="sm" variant="secondary" className="rounded-full">
              <Link href="/dashboard/resumes">Refresh resume signals</Link>
            </Button>
          </div>

          {process.env.NODE_ENV !== "production" && meta && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Dev diagnostics
              </p>
              <p className="mt-1 text-xs text-slate-600">
                mode={meta.mode}
                {typeof meta.cached === "boolean" ? ` · cache=${meta.cached ? "HIT" : "MISS"}` : ""}
                {` · generated=${new Date(meta.generatedAt).toLocaleTimeString()}`}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  { label: "summary", value: meta.timings.summaryMs },
                  { label: "insights", value: meta.timings.insightsMs },
                  { label: "applications", value: meta.timings.applicationsMs },
                  { label: "recommended", value: meta.timings.recommendedMs },
                  { label: "enrollments", value: meta.timings.enrollmentsMs },
                  { label: "resumes", value: meta.timings.resumesMs },
                  { label: "savedIds", value: meta.timings.savedIdsMs },
                ].map((item) => (
                  <span
                    key={item.label}
                    className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${getTimingBadgeClass(item.value)}`}
                  >
                    {item.label}: {item.value}ms
                  </span>
                ))}
              </div>

              {criticalWarnings.length > 0 && (
                <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs text-rose-800">
                  <span className="font-semibold">Regression warning:</span> {criticalWarnings.join(" | ")}
                </div>
              )}
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-3">
            {highlightStats.map((stat) => (
              <div key={stat.title} className="rounded-2xl border border-slate-100 bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{stat.title}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{stat.value}</p>
                <p className="mt-1 text-xs text-slate-500">{stat.helper}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="grid gap-4 lg:grid-cols-3">
          <GlassCard className="p-5">{renderFocusHighlight()}</GlassCard>
          <GlassCard className="p-5">{renderPipelineHighlight()}</GlassCard>
          <GlassCard className="p-5">{renderJobHighlight()}</GlassCard>
        </div>

        <GlassCard className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Performance metrics</p>
            <Badge variant="secondary" className="rounded-full">
              Live snapshot
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-slate-100 bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{metric.label}</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{metric.value}</p>
                <p className="mt-1 text-xs text-slate-500">{metric.helper}</p>
                <Button asChild variant="ghost" size="sm" className="mt-2 px-0 text-slate-600 hover:text-slate-900">
                  <Link href={metric.action}>Open</Link>
                </Button>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    );
  };

  const renderResumesTab = () => {
    if (!data) {
      return (
        <GlassCard className="p-6">
          <Skeleton className="h-32 w-full" />
        </GlassCard>
      );
    }

    return (
      <GlassCard className="space-y-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Resumes</p>
            <h3 className="text-2xl font-semibold text-slate-900">Storyteller toolkit</h3>
            <p className="text-sm text-slate-500">Manage versions, AI feedback, and visibility.</p>
          </div>
          <div className="flex items-center gap-2">
            <ImportResumeModal />
            <Button asChild>
              <Link href="/dashboard/resumes">Manage resumes</Link>
            </Button>
          </div>
        </div>
        {data.resumes.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.resumes.map((resume) => (
              <div key={resume.id} className="rounded-2xl border border-slate-100 bg-white/80 p-4">
                <p className="text-sm font-semibold text-slate-900">{resume.title}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{resume.visibility}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <span>Slug</span>
                  <Badge variant="outline" className="rounded-full border-slate-200">
                    {resume.slug}
                  </Badge>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button asChild size="sm" variant="secondary" className="rounded-full">
                    <Link href={`/resume/${resume.slug}/edit`}>Edit</Link>
                  </Button>
                  <Button asChild size="sm" variant="ghost" className="rounded-full">
                    <Link href={resume.shareSlug ? `/resume/share/${resume.shareSlug}` : `/resume/${resume.slug}/preview`}>
                      Share
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
            <p>You haven&apos;t created a resume yet. Build one to unlock AI insights and tracking.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ImportResumeModal />
              <Button asChild size="sm">
                <Link href="/dashboard/resumes">Launch builder</Link>
              </Button>
            </div>
          </div>
        )}
      </GlassCard>
    );
  };

  const renderJobsTab = () => {
    if (!data) {
      return (
        <GlassCard className="p-6">
          <Skeleton className="h-32 w-full" />
        </GlassCard>
      );
    }

    const jobApplications = data.applications.jobs;
    const volunteerApplications = data.applications.volunteer;
    const allApplications = [...jobApplications, ...volunteerApplications];

    return (
      <div className="space-y-8">
        {/* Job Recommendations */}
        {data.recommended.length > 0 ? (
          <GlassCard className="space-y-6 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Recommendations</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">Matching opportunities</h3>
                <p className="text-sm text-slate-600 mt-1">Roles tailored to your profile.</p>
              </div>
              <Button asChild className="rounded-full">
                <Link href="/jobs">View more</Link>
              </Button>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {data.recommended.map((job) => (
                <div key={job.id} className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white/80 p-6 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-2">{job.title}</h4>
                      <p className="text-xs text-slate-600 mt-1">{job.company}</p>
                    </div>
                    <Briefcase className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    {job.location ?? job.remoteOption ?? "Remote friendly"}
                  </p>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="ghost" className="rounded-full text-slate-600 flex-1">
                      <Link href={`/jobs/${job.slug}`}>View</Link>
                    </Button>
                    <Button asChild size="sm" className="rounded-full flex-1">
                      <Link href={`/jobs/${job.slug}`}>Apply</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="space-y-4 p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Opportunities</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">No recommendations yet</h3>
            </div>
            <p className="text-sm text-slate-600">
              Update your profile or enroll in a course to unlock tailored job recommendations.
            </p>
            <Button asChild size="sm" variant="secondary" className="w-fit">
              <Link href="/dashboard/jobs">Browse roles</Link>
            </Button>
          </GlassCard>
        )}

        {/* Active Applications */}
        {allApplications.length > 0 && (
          <GlassCard className="space-y-6 p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Pipeline</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">Your applications</h3>
              <p className="text-sm text-slate-600 mt-1">Track where you are in the hiring process.</p>
            </div>
            <div className="space-y-3">
              {allApplications.map((application) => (
                <div key={application.id} className="rounded-xl border border-slate-100 bg-white/50 p-4 flex items-start justify-between hover:bg-white hover:border-slate-200 transition-all">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{application.opportunity.title}</p>
                    <p className="text-sm text-slate-600">{application.opportunity.company ?? application.opportunity.organization}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Applied {application.submittedAt
                        ? new Date(application.submittedAt).toLocaleDateString()
                        : "recently"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <Badge
                      className={
                        application.status === "ACCEPTED"
                          ? "bg-emerald-100 text-emerald-800"
                          : application.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : application.status === "INTERVIEW_SCHEDULED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                      }
                    >
                      {application.status.replace("_", " ")}
                    </Badge>
                    <Button asChild size="sm" variant="ghost">
                      <Link href='/dashboard/jobs'>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    );
  };

  const renderApplicationsInJobsTab = () => {
    const jobApplications = data?.applications.jobs ?? [];
    const volunteerApplications = data?.applications.volunteer ?? [];
    const allApplications = [...jobApplications, ...volunteerApplications];

    if (allApplications.length === 0) {
      return (
        <div className="space-y-4 py-8 text-center">
          <div className="inline-block p-4 rounded-full bg-amber-50 mb-2">
            <Briefcase className="h-8 w-8 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No applications yet</h3>
          <p className="text-sm text-slate-600 mb-4">Start your job search by browsing opportunities</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {allApplications.map((application) => (
          <div
            key={application.id}
            className="rounded-lg border border-slate-100 bg-white/50 p-4 hover:bg-white hover:border-slate-200 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-900 line-clamp-1">{application.opportunity.title}</h4>
                <p className="text-sm text-slate-600 line-clamp-1">
                  {application.opportunity.company || application.opportunity.organization}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Applied {
                    application.submittedAt
                      ? new Date(application.submittedAt).toLocaleDateString()
                      : new Date(application.updatedAt || Date.now()).toLocaleDateString()
                  }
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge
                  className={`whitespace-nowrap text-xs font-medium ${
                    application.status === "ACCEPTED"
                      ? "bg-emerald-100 text-emerald-800"
                      : application.status === "REJECTED"
                        ? "bg-red-100 text-red-800"
                        : application.status === "INTERVIEW_SCHEDULED"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {application.status.replace(/_/g, " ")}
                </Badge>
                <Button asChild size="sm" variant="ghost" className="rounded-full text-slate-600">
                  <Link href='/dashboard/jobs'>View</Link>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* OVERVIEW SECTION - Simplified */}
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.45em] text-slate-500">{overviewLabel}</p>
          <h2 className="text-3xl font-bold text-slate-900 mt-2">{overviewTitle}</h2>
        </div>
      </div>

      {/* KEY METRICS - Only Essential Stats */}
      <div className="grid gap-3 md:grid-cols-3">
        {metrics.slice(0, 3).map((metric) => (
          <GlassCard key={metric.label} className="p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{metric.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{metric.value}</p>
            <p className="mt-1 text-xs text-slate-600">{metric.helper}</p>
            {metric.action && (
              <Button asChild size="sm" variant="ghost" className="mt-3 text-blue-600 hover:text-blue-700">
                <Link href={metric.action}>View →</Link>
              </Button>
            )}
          </GlassCard>
        ))}
      </div>

      {/* INSIGHTS & GUIDANCE SECTION */}
      <div id="insights-guidance" className="scroll-mt-28">
        {renderInsightsTab()}
      </div>

      {/* COURSES SECTION */}
      <div>
        <EnhancedCoursesTab 
          courses={
            data?.enrollments.map((enrollment) => ({
              id: enrollment.id,
              title: enrollment.course.title,
              slug: enrollment.course.slug,
              level: enrollment.course.level,
              tagline: enrollment.course.tagline,
              progress: enrollment.progressPercentage,
            })) ?? []
          } 
          loading={loading} 
        />
      </div>

      {/* RESUMES SECTION */}
      <div>
        {renderResumesTab()}
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <GlassCard variant="gradient" className="p-6">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="mt-4 flex flex-wrap gap-2">
          <Skeleton className="h-9 w-32 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
      </GlassCard>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <GlassCard key={idx} className="p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-7 w-16" />
            <Skeleton className="mt-2 h-3 w-32" />
          </GlassCard>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, idx) => (
          <GlassCard key={idx} className="p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-2 h-6 w-40" />
            <Skeleton className="mt-2 h-3 w-48" />
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

function InsightsTabSkeleton() {
  return (
    <div className="space-y-6">
      <GlassCard variant="gradient" className="space-y-4 p-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <div className="grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-100 bg-white/80 p-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-2 h-7 w-12" />
              <Skeleton className="mt-2 h-3 w-28" />
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <GlassCard key={idx} className="p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-6 w-3/4" />
            <Skeleton className="mt-2 h-3 w-full" />
            <Skeleton className="mt-4 h-8 w-28 rounded-full" />
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
