"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassCardError } from "@/components/ui/glass-card-error";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

type SectionResponse = {
  data: SectionData;
  errors: SectionErrors;
};

type Metric = {
  label: string;
  value: string | number;
  helper: string;
  action: string;
};

type HighlightStat = {
  title: string;
  value: string | number;
  description: string;
};

export function DashboardSectionsClient() {
  const [sectionResponse, setSectionResponse] = useState<SectionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadSections = async () => {
      try {
        const res = await fetch("/api/dashboard/sections", { cache: "no-store" });
        const payload = (await res.json()) as SectionResponse;
        if (isMounted) {
          setSectionResponse(payload);
        }
      } catch (error) {
        console.error("Dashboard sections fetch failed", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadSections();

    return () => {
      isMounted = false;
    };
  }, []);

  const data = sectionResponse?.data;
  const errors = sectionResponse?.errors;
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

  const metrics = useMemo<Metric[]>(
    () => [
      {
        label: "Courses enrolled",
        value: loading ? "—" : summary?.enrollmentsCount ?? activeCourses,
        helper: activeCourses ? "Keep your streak alive" : "Start a track to unlock guidance",
        action: "/dashboard/courses",
      },
      {
        label: "Courses completed",
        value: loading ? "—" : summary?.completedEnrollmentsCount ?? 0,
        helper:
          (summary?.completedEnrollmentsCount ?? 0) > 0
            ? "Celebrate milestones"
            : "Finish a course to unlock certificates",
        action: "/dashboard/courses",
      },
      {
        label: "Resumes created",
        value: loading ? "—" : summary?.resumesCount ?? resumesCount,
        helper: resumesCount ? "Refresh insights anytime" : "Generate an ATS-ready resume",
        action: "/dashboard/resume",
      },
      {
        label: "Resume views",
        value: loading ? "—" : summary?.resumeViewsCount ?? 0,
        helper:
          (summary?.resumeViewsCount ?? 0) > 0
            ? "People are checking you out"
            : "Share your profile link to gain traction",
        action: "/resume/share",
      },
      {
        label: "Jobs applied",
        value: loading ? "—" : summary?.jobApplicationsCount ?? 0,
        helper: applicationsCount ? "Track responses in dashboard" : "Submit at least one this week",
        action: "/applications",
      },
      {
        label: "Volunteer apps",
        value: loading ? "—" : summary?.volunteerApplicationsCount ?? 0,
        helper:
          (summary?.volunteerApplicationsCount ?? 0) > 0
            ? "Stay close to your mission goals"
            : "Volunteer work boosts resumes",
        action: "/applications",
      },
    ], [activeCourses, applicationsCount, loading, resumesCount, summary]
  );

  const highlightStats = useMemo<HighlightStat[]>(
    () => [
      {
        title: "Career momentum",
        value: loading ? "—" : summary?.applicationsCount ?? applicationsCount,
        description: "Total applications across jobs & volunteer roles",
      },
      {
        title: "Completed tracks",
        value: loading ? "—" : summary?.completedEnrollmentsCount ?? 0,
        description: "Courses fully mastered",
      },
      {
        title: "Profile reach",
        value: loading ? "—" : summary?.resumeViewsCount ?? 0,
        description: "Public resume impressions",
      },
    ], [applicationsCount, loading, summary]
  );

  const tabContent = useMemo(
    () => [
      {
        value: "overview",
        label: "Overview",
        content: (
          <div className="grid gap-6 lg:grid-cols-2">
            <GlassCard className="p-5">
              {loading && !data?.enrollments[0] ? <Skeleton className="h-16 w-full" /> : <LatestCourse data={data} errors={errors} />}
            </GlassCard>
            <GlassCard className="p-5">
              {loading && !data?.applications.jobs[0] && !data?.applications.volunteer[0]
                ? <Skeleton className="h-16 w-full" />
                : <PipelineHighlight data={data} errors={errors} />}
            </GlassCard>
            <GlassCard className="p-5">
              <InsightsHighlight data={data} errors={errors} />
            </GlassCard>
            <GlassCard className="p-5">
              <JobHighlight data={data} errors={errors} />
            </GlassCard>
          </div>
        ),
      },
*** End Patch

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

type DashboardSummary = {
  enrollmentsCount: number;
  completedEnrollmentsCount: number;
  resumesCount: number;
  applicationsCount: number;
  jobApplicationsCount: number;
  volunteerApplicationsCount: number;
  resumeViewsCount: number;
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
  const summary = data?.summary;
  const summaryError = errors?.summary;

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

  const topCourse = data?.enrollments?.[0];
  const topApplication = data?.applications?.jobs?.[0] ?? data?.applications?.volunteer?.[0] ?? null;
  const featuredFocus = data?.insights?.focus?.[0];
  const skillInsight = data?.insights?.skills;
  const featuredJob = data?.recommended?.[0];

  const metrics = [
    {
      label: "Courses enrolled",
      value: loading ? "—" : summary?.enrollmentsCount ?? activeCourses,
      helper: activeCourses ? "Keep your streak alive" : "Start a track to unlock guidance",
      action: "/dashboard/courses",
    },
    {
      label: "Courses completed",
      value: loading ? "—" : summary?.completedEnrollmentsCount ?? 0,
      helper:
        (summary?.completedEnrollmentsCount ?? 0) > 0
          ? "Celebrate milestones"
          : "Finish a course to unlock certificates",
      action: "/dashboard/courses",
    },
    {
      label: "Resumes created",
      value: loading ? "—" : summary?.resumesCount ?? resumesCount,
      helper: resumesCount ? "Refresh insights anytime" : "Generate an ATS-ready resume",
      action: "/dashboard/resume",
    },
    {
      label: "Resume views",
      value: loading ? "—" : summary?.resumeViewsCount ?? 0,
      helper:
        (summary?.resumeViewsCount ?? 0) > 0
          ? "People are checking you out"
          : "Share your profile link to gain traction",
      action: "/resume/share",
    },
    {
      label: "Jobs applied",
      value: loading ? "—" : summary?.jobApplicationsCount ?? 0,
      helper: applicationsCount ? "Track responses in dashboard" : "Submit at least one this week",
      action: "/applications",
    },
    {
      label: "Volunteer apps",
      value: loading ? "—" : summary?.volunteerApplicationsCount ?? 0,
      helper:
        (summary?.volunteerApplicationsCount ?? 0) > 0
          ? "Stay close to your mission goals"
          : "Volunteer work boosts resumes",
      action: "/applications",
    },
  ];

  const highlightStats = [
    {
      title: "Career momentum",
      value: loading ? "—" : `${summary?.applicationsCount ?? applicationsCount}`,
      helper: "Total applications this account has shipped",
    },
    {
      title: "Completed tracks",
      value: loading ? "—" : `${summary?.completedEnrollmentsCount ?? 0}`,
      helper: "Courses fully mastered",
    },
    {
      title: "Profile reach",
      value: loading ? "—" : `${summary?.resumeViewsCount ?? 0}`,
      helper: "Public resume impressions",
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

  const renderCoursesTab = () => {
    if (!data) {
      return (
        <GlassCard className="p-6">
          <Skeleton className="h-32 w-full" />
        </GlassCard>
      );
    }

    const enrollments = data.enrollments ?? [];
    return (
      <GlassCard className="space-y-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Courses</p>
            <h3 className="text-2xl font-semibold text-slate-900">Learning runway</h3>
            <p className="text-sm text-slate-500">Structured roadmap of your enrollments.</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/courses">Open catalog</Link>
          </Button>
        </div>
        {enrollments.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {enrollments.map((enrollment) => (
              <div key={enrollment.id} className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{enrollment.course.title}</p>
                <p className="text-xs text-slate-500">{enrollment.course.level ?? "Self-paced"}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>Progress</span>
                  <span>{enrollment.progressPercentage ?? 0}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                    style={{ width: `${enrollment.progressPercentage ?? 0}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="secondary" className="rounded-full bg-blue-50 text-blue-700">
                    {enrollment.course.level ?? "Self-paced"}
                  </Badge>
                  <Button asChild variant="ghost" size="sm" className="px-0 text-slate-600">
                    <Link href={`/courses/${enrollment.course.slug ?? enrollment.course.id}`}>Resume</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
            <p>No courses yet. Enroll to unlock focus recommendations.</p>
            <Button asChild size="sm" className="mt-3">
              <Link href="/dashboard/courses">Browse catalog</Link>
            </Button>
          </div>
        )}
      </GlassCard>
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

    const resumes = data.resumes ?? [];
    return (
      <GlassCard className="space-y-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Resumes</p>
            <h3 className="text-2xl font-semibold text-slate-900">Storyteller toolkit</h3>
            <p className="text-sm text-slate-500">Manage versions, AI feedback, and visibility.</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/resume">Manage resumes</Link>
          </Button>
        </div>
        {resumes.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {resumes.map((resume) => (
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
                    <Link href={`/resume/share/${resume.slug}`}>Share</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
            <p>You haven’t created a resume yet. Build one to unlock AI insights and tracking.</p>
            <Button asChild size="sm" className="mt-3">
              <Link href="/resume/builder">Launch builder</Link>
            </Button>
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

    const recommendedJobs = data.recommended ?? [];
    return (
      <GlassCard className="space-y-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Jobs</p>
            <h3 className="text-2xl font-semibold text-slate-900">Opportunities radar</h3>
            <p className="text-sm text-slate-500">Hand-picked roles plus your latest pipeline.</p>
          </div>
          <Button asChild>
            <Link href="/jobs">View all roles</Link>
          </Button>
        </div>
        {recommendedJobs.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {recommendedJobs.map((job) => (
              <div key={job.id} className="rounded-2xl border border-slate-100 bg-white/80 p-4">
                <p className="text-sm font-semibold text-slate-900">{job.title}</p>
                <p className="text-xs text-slate-500">{job.company}</p>
                <p className="text-xs text-slate-400">
                  {job.location ?? job.remoteOption ?? "Remote friendly"}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button asChild size="sm" variant="ghost" className="rounded-full text-slate-600">
                    <Link href={`/jobs/${job.slug}`}>View</Link>
                  </Button>
                  <Button asChild size="sm" className="rounded-full">
                    <Link href={`/jobs/${job.slug}`}>Apply</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
            <p>No recommendations yet. Update your profile or enroll in a course to unlock tailored roles.</p>
            <Button asChild size="sm" className="mt-3" variant="secondary">
              <Link href="/jobs">Browse roles</Link>
            </Button>
          </div>
        )}
      </GlassCard>
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
    <section className="space-y-8">
      <GlassCard variant="gradient" className="overflow-hidden border border-slate-200/70">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Career pulse</p>
            <h2 className="text-3xl font-semibold text-slate-900">Progress that recruiters notice</h2>
            <p className="text-sm text-slate-600">{quickSummary()}</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild className="rounded-full">
                <Link href="/dashboard/courses">Continue learning</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/applications">Track applications</Link>
              </Button>
            </div>
          </div>
          <div className="space-y-3 rounded-3xl border border-slate-100/60 bg-white/70 p-5">
            {summaryError ? (
              <GlassCardError message={summaryError} />
            ) : (
              highlightStats.map((stat) => (
                <div key={stat.title} className="rounded-2xl border border-slate-100 bg-white/90 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{stat.title}</p>
                  <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.helper}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <GlassCard key={metric.label} className="space-y-2 border-slate-100 bg-white/90 p-4">
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">{metric.label}</p>
            <p className="text-3xl font-semibold text-slate-900">{metric.value}</p>
            <p className="text-sm text-slate-500">{metric.helper}</p>
            <Button asChild variant="link" size="sm" className="px-0 text-slate-600">
              <Link href={metric.action}>Open</Link>
            </Button>
          </GlassCard>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 rounded-2xl bg-slate-50 p-1 text-sm">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="resumes">Resumes</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <GlassCard className="p-5">
              {loading && !topCourse ? <Skeleton className="h-16 w-full" /> : renderLatestCourse()}
            </GlassCard>
            <GlassCard className="p-5">
              {loading && !topApplication ? <Skeleton className="h-16 w-full" /> : renderPipelineHighlight()}
            </GlassCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <GlassCard className="p-5">{renderFocusHighlight()}</GlassCard>
            <GlassCard className="p-5">{renderJobHighlight()}</GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="courses">{renderCoursesTab()}</TabsContent>
        <TabsContent value="resumes">{renderResumesTab()}</TabsContent>
        <TabsContent value="jobs">{renderJobsTab()}</TabsContent>
      </Tabs>
    </section>
  );
}
