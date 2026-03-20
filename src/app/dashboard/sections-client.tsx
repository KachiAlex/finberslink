"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
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

  const quickSummary = () => {
    if (loading) {
      return "We're collecting your latest stats";
    }

    if (!data) {
      return "Stay tuned—your learning signals will appear here.";
    }

    return `${data.enrollments.length || "No"} active course${data.enrollments.length === 1 ? "" : "s"}, ${
      data.resumes.length || "no"
    } resume${data.resumes.length === 1 ? "" : "s"}, ${
      data.applications.jobs.length + data.applications.volunteer.length || "no"
    } application${
      data.applications.jobs.length + data.applications.volunteer.length === 1 ? "" : "s"
    } in motion.`;
  };

  const activeCourses = data?.enrollments?.length ?? 0;
  const resumesCount = data?.resumes?.length ?? 0;
  const applicationsCount =
    (data?.applications?.jobs.length ?? 0) + (data?.applications?.volunteer.length ?? 0);
  const recommendedCount = data?.recommended?.length ?? 0;

  const topCourse = data?.enrollments?.[0];
  const topApplication = data?.applications?.jobs?.[0] ?? data?.applications?.volunteer?.[0] ?? null;
  const featuredFocus = data?.insights?.focus?.[0];
  const skillInsight = data?.insights?.skills;
  const featuredJob = data?.recommended?.[0];

  const metrics = [
    {
      label: "Active courses",
      value: loading ? "—" : activeCourses,
      helper: activeCourses ? "Keep your streak alive" : "Start a track to unlock guidance",
      action: "/dashboard/courses",
    },
    {
      label: "Resumes",
      value: loading ? "—" : resumesCount,
      helper: resumesCount ? "Refresh insights anytime" : "Generate an ATS-ready resume",
      action: "/dashboard/resume",
    },
    {
      label: "Applications",
      value: loading ? "—" : applicationsCount,
      helper: applicationsCount ? "Track responses in dashboard" : "Submit at least one this week",
      action: "/applications",
    },
    {
      label: "Recommended roles",
      value: loading ? "—" : recommendedCount,
      helper: recommendedCount ? "Tailored from your activity" : "Update your profile for matches",
      action: "/jobs",
    },
  ];

  const OverviewSkeleton = () => (
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
          <Link href={`/courses/${topCourse.course.slug ?? topCourse.course.id}`}>Continue course</Link>
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
            <Link href="/jobs">Browse roles</Link>
          </Button>
        </div>
      );
    }

    const opportunityCompany = "company" in topApplication.opportunity
      ? topApplication.opportunity.company
      : topApplication.opportunity.organization;

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
            <Link href={`/applications/${topApplication.id}`}>View</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/jobs/${topApplication.opportunity.id ?? topApplication.opportunity.slug ?? ""}`}>
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
            {skillInsight.personaName || skillInsight.targetRoles[0] || "Your skill graph"}
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
          <Link href="/resume/builder">Create resume</Link>
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
            <Link href="/jobs">Browse roles</Link>
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

  if (loading && !data) {
    return (
      <section>
        <OverviewSkeleton />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <GlassCard variant="gradient" className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-slate-400">Overview</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Here’s where you stand</h2>
            <p className="text-sm text-slate-600">{quickSummary()}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="rounded-full">
              <Link href="/dashboard/courses">Continue learning</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/applications">Review applications</Link>
            </Button>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <GlassCard key={metric.label} className="p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{metric.value}</p>
            <p className="text-sm text-slate-500">{metric.helper}</p>
            <Button asChild variant="ghost" size="sm" className="mt-3 px-0 text-slate-600">
              <Link href={metric.action}>Open</Link>
            </Button>
          </GlassCard>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <GlassCard className="p-5">
          {loading && !topCourse ? <Skeleton className="h-16 w-full" /> : renderLatestCourse()}
        </GlassCard>
        <GlassCard className="p-5">
          {loading && !topApplication ? <Skeleton className="h-16 w-full" /> : renderPipelineHighlight()}
        </GlassCard>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <GlassCard className="p-5">{renderFocusHighlight()}</GlassCard>
        <GlassCard className="p-5">{renderJobHighlight()}</GlassCard>
      </div>
    </section>
  );
}
