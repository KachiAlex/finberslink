"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Briefcase, MapPin, Calendar, Filter, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassCardError } from "@/components/ui/glass-card-error";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobBrowserButton } from "@/components/jobs/job-browser-button";

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
  helper: string;
};

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

  const renderCoursesTab = () => {
    if (!data) {
      return (
        <GlassCard className="p-6">
          <Skeleton className="h-32 w-full" />
        </GlassCard>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Courses</p>
            <h3 className="text-2xl font-semibold text-slate-900">Learning runway</h3>
            <p className="text-sm text-slate-500">Structured roadmap of your enrollments.</p>
          </div>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/dashboard/courses">Browse Catalog</Link>
          </Button>
        </div>

        {data.enrollments.length ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {data.enrollments.map((enrollment) => {
              const progressVariant = 
                (enrollment.progressPercentage ?? 0) >= 75 ? 'emerald' :
                (enrollment.progressPercentage ?? 0) >= 50 ? 'blue' :
                (enrollment.progressPercentage ?? 0) >= 25 ? 'amber' : 'slate';

              const progressColor = {
                emerald: 'from-emerald-500 to-green-500',
                blue: 'from-blue-500 to-cyan-500',
                amber: 'from-amber-500 to-orange-500',
                slate: 'from-slate-400 to-slate-500',
              }[progressVariant];

              return (
                <div 
                  key={enrollment.id} 
                  className="group rounded-2xl border border-slate-200 hover:border-blue-300 bg-gradient-to-br from-white via-slate-50 to-slate-50 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-blue-200/30"
                >
                  {/* Course Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {enrollment.course.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">{enrollment.course.level ?? "Self-paced"}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-blue-600">{enrollment.progressPercentage ?? 0}%</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${progressColor} transition-all duration-500`}
                        style={{ width: `${enrollment.progressPercentage ?? 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 mb-4 py-3 border-y border-slate-200">
                    <div className="text-center">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Lessons</p>
                      <p className="text-sm font-semibold text-slate-900">8/10</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Time</p>
                      <p className="text-sm font-semibold text-slate-900">12h 30m</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Status</p>
                      <p className="text-sm font-semibold text-emerald-600">On Track</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button asChild className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" size="sm">
                      <Link href={`/courses/${enrollment.course.slug ?? enrollment.course.id}`}>
                        Continue
                      </Link>
                    </Button>
                    {(enrollment.progressPercentage ?? 0) >= 100 && (
                      <Button variant="outline" className="flex-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50" size="sm">
                        View Certificate
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-blue-50 p-8 text-center transition-all hover:border-blue-300 hover:shadow-md">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
              <BookOpen className="h-7 w-7 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No courses yet</h3>
            <p className="text-sm text-slate-600 mb-4">Start learning by enrolling in a course from our catalog.</p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/courses">Browse Courses</Link>
            </Button>
          </div>
        )}

        {/* Learning Stats */}
        {data.enrollments.length > 0 && (
          <div className="grid gap-4 md:grid-cols-4">
            <GlassCard className="p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Total Progress</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {Math.round(
                  data.enrollments.reduce((sum, e) => sum + (e.progressPercentage ?? 0), 0) /
                  data.enrollments.length || 0
                )}%
              </p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Active Courses</p>
              <p className="text-3xl font-bold text-cyan-600 mt-1">{data.enrollments.length}</p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Completed</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">
                {data.enrollments.filter((e) => (e.progressPercentage ?? 0) >= 100).length}
              </p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Hours Invested</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">
                {data.enrollments.length * 12}+
              </p>
            </GlassCard>
          </div>
        )}
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
          <Button asChild>
            <Link href="/dashboard/resumes">Manage resumes</Link>
          </Button>
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
                    <Link href={`/resume/share?slug=${resume.slug}`}>Share</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
            <p>You haven&apos;t created a resume yet. Build one to unlock AI insights and tracking.</p>
            <Button asChild size="sm" className="mt-3">
              <Link href="/dashboard/resumes">Launch builder</Link>
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

    const jobApplications = data.applications.jobs;
    const volunteerApplications = data.applications.volunteer;
    const allApplications = [...jobApplications, ...volunteerApplications];

    // Stats for job applications
    const appliedCount = jobApplications.length;
    const inProgressCount = jobApplications.filter((app) => app.status === "APPLIED" || app.status === "UNDER_REVIEW").length;
    const succeededCount = jobApplications.filter((app) => app.status === "ACCEPTED").length;

    return (
      <div className="space-y-8">
        {/* Application Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Jobs Applied</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{appliedCount}</p>
            <p className="text-xs text-slate-500 mt-2">Total applications</p>
          </GlassCard>
          <GlassCard className="p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">In Progress</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{inProgressCount}</p>
            <p className="text-xs text-slate-500 mt-2">Under review</p>
          </GlassCard>
          <GlassCard className="p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Interviews</p>
            <p className="text-3xl font-bold text-emerald-600 mt-2">{jobApplications.filter((app) => app.status === "INTERVIEW_SCHEDULED").length}</p>
            <p className="text-xs text-slate-500 mt-2">Scheduled</p>
          </GlassCard>
          <GlassCard className="p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Offers</p>
            <p className="text-3xl font-bold text-amber-600 mt-2">{succeededCount}</p>
            <p className="text-xs text-slate-500 mt-2">Accepted offers</p>
          </GlassCard>
        </div>

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

  if (loading && !data) {
    return (
      <section>
        <OverviewSkeleton />
      </section>
    );
  }

  return (
    <div className="space-y-8">
      {/* COURSES SECTION */}
      <div>
        <GlassCard className="p-6">
          {renderCoursesTab()}
        </GlassCard>
      </div>

      {/* JOBS SECTION */}
      <div className="space-y-6">
        {/* Job Stats Cards */}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <GlassCard className="p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-medium">Applied</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{data.applications.jobs.length}</p>
              <p className="text-xs text-slate-500 mt-2">Job applications</p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-medium">In Progress</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {data.applications.jobs.filter((a) => a.status === "APPLIED" || a.status === "UNDER_REVIEW").length}
              </p>
              <p className="text-xs text-slate-500 mt-2">Under review</p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-medium">Interviews</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {data.applications.jobs.filter((a) => a.status === "INTERVIEW_SCHEDULED").length}
              </p>
              <p className="text-xs text-slate-500 mt-2">Scheduled</p>
            </GlassCard>
            <GlassCard className="p -4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-medium">Offers</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {data.applications.jobs.filter((a) => a.status === "ACCEPTED").length}
              </p>
              <p className="text-xs text-slate-500 mt-2">Accepted</p>
            </GlassCard>
          </div>
        )}

        {/* Job Recommendations */}
        {data && data.recommended.length > 0 && (
          <GlassCard className="space-y-4 p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-medium">Opportunities</p>
              <h3 className="text-lg font-bold text-slate-900 mt-1">Matching opportunities</h3>
              <p className="text-sm text-slate-600 mt-1">Roles tailored to your profile and skills.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {data.recommended.slice(0, 4).map((job) => (
                <div
                  key={job.id}
                  className="rounded-lg border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-4 hover:border-blue-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <Briefcase className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">{job.title}</h4>
                      <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{job.company}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">{job.location || job.remoteOption || "Remote friendly"}</p>
                  <Button asChild size="sm" className="w-full rounded-lg bg-blue-600 hover:bg-blue-700">
                    <Link href={`/jobs/${job.slug}`}>View & Apply</Link>
                  </Button>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Active Applications Section */}
        <GlassCard className="space-y-4 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-medium">Pipeline</p>
            <h3 className="text-lg font-bold text-slate-900 mt-1">Your applications</h3>
            <p className="text-sm text-slate-600 mt-1">Track where you are in the hiring process.</p>
          </div>
          {renderApplicationsInJobsTab()}
        </GlassCard>
      </div>

      {/* RESUMES SECTION */}
      <div>
        <GlassCard className="p-6">
          {renderResumesTab()}
        </GlassCard>
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
