"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassCardError } from "@/components/ui/glass-card-error";
import { Skeleton } from "../../components/ui/skeleton";

type DashboardSummary = {
  enrollmentsCount: number;
  completedEnrollmentsCount: number;
  resumesCount: number;
  applicationsCount: number;
  jobApplicationsCount: number;
  volunteerApplicationsCount: number;
  resumeViewsCount: number;
};

type HighlightStat = {
  title: string;
  value: string | number;
  helper: string;
};

interface SectionData {
  summary: DashboardSummary | null;
  enrollments: Array<{ id: string; progressPercentage?: number | null; course: { id: string; title: string; slug?: string | null; level?: string | null; tagline?: string | null } }>;
  resumes: Array<{ id: string; title: string; visibility: string; slug: string }>;
  applications: { jobs: any[]; volunteer: any[] };
  recommended: Array<{ id: string; title: string; company: string; location?: string | null; remoteOption?: string | null; slug: string }>;
  savedIds: string[];
  insights: {
    focus?: any[];
    skills?: any;
  };
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

const LOADING_HIGHLIGHTS: HighlightStat[] = [
  { title: "Career momentum", value: "—", helper: "Loading" },
  { title: "Completed tracks", value: "—", helper: "Loading" },
  { title: "Profile reach", value: "—", helper: "Loading" },
];

export function CareerPulseSection() {
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
        console.error("Career pulse fetch failed", error);
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

  const highlightStats = useMemo<HighlightStat[]>(
    () => {
      if (!data?.summary) {
        return LOADING_HIGHLIGHTS;
      }

      return [
        {
          title: "Career momentum",
          value: loading ? "—" : data.summary.applicationsCount ?? applicationsCount,
          helper: "Total applications across jobs & volunteer roles",
        },
        {
          title: "Completed tracks",
          value: loading ? "—" : data.summary.completedEnrollmentsCount ?? 0,
          helper: "Courses fully mastered",
        },
        {
          title: "Profile reach",
          value: loading ? "—" : data.summary.resumeViewsCount ?? 0,
          helper: "Public resume impressions",
        },
      ];
    },
    [applicationsCount, data?.summary, loading]
  );

  if (loading && !data) {
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
      </div>
    );
  }

  return (
    <section className="space-y-8">
      <GlassCard variant="gradient" className="overflow-hidden border border-slate-200/70">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Career pulse</p>
            <h2 className="text-3xl font-semibold text-slate-900">Progress that recruiters notice</h2>
            <p className="text-sm text-slate-600">{quickSummary}</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild className="rounded-full">
                <Link href="/dashboard/courses">Continue learning</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/dashboard/applications">Track applications</Link>
              </Button>
            </div>
          </div>
          <div className="space-y-3 rounded-3xl border border-slate-100/60 bg-white/70 p-5">
            {errors?.summary ? (
              <GlassCardError message={errors.summary} />
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
    </section>
  );
}
