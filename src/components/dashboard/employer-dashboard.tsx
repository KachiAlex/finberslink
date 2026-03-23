"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, Users, TrendingUp, CheckCircle } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

interface EmployerDashboardProps {
  userId: string;
}

interface EmployerInsights {
  jobsPosted: number;
  applicationsReceived: number;
  offeredCandidates: number;
  conversionRate: number;
}

export function EmployerDashboard({ userId: _userId }: EmployerDashboardProps) {
  const [insights, setInsights] = useState<EmployerInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await fetch("/api/dashboard/insights");
        const data = await res.json();
        setInsights(data.insights);
      } catch (error) {
        console.error("Failed to fetch insights:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  return (
    <>
      <DashboardHero
        eyebrow="Employer workspace"
        title="Keep your talent pipeline moving"
        description="See open roles, review candidates, and send offers without bouncing between tools."
        accent="green"
        actions={[
          { label: "Post a role", href: "/jobs/post" },
          { label: "Review candidates", href: "/employer/applications", variant: "secondary" },
        ]}
      />

      {!loading && insights && (
        <DashboardSection
          eyebrow="Pipeline health"
          title="Hiring metrics"
          description="Where your talent funnel stands today"
        >
          <p className="text-xs text-slate-500">Metrics look at the trailing 30 days across all published jobs.</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Active Jobs" value={insights.jobsPosted} icon={Briefcase} trend={{ value: 12, isPositive: true }} variant="minimal" />
            <StatCard title="Applications" value={insights.applicationsReceived} icon={Users} variant="minimal" />
            <StatCard title="Offers sent" value={insights.offeredCandidates} icon={CheckCircle} variant="minimal" />
            <StatCard title="Conversion Rate" value={`${insights.conversionRate}%`} icon={TrendingUp} variant="minimal" />
          </div>
        </DashboardSection>
      )}

      <section className="grid gap-6 md:grid-cols-2">
        <DashboardSection
          eyebrow="Actions"
          title="Keep candidates moving"
          description="Most frequent steps"
          actions={[{ label: "View all jobs", href: "/employer/jobs", variant: "ghost" }]}
        >
          <p className="text-xs text-slate-500">Stay within these links to knock out the top admin tasks quickly.</p>
          <div className="space-y-2">
            <Link href="/employer/applications" className="block rounded-md bg-slate-50 p-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
              Review candidate pipeline
            </Link>
            <Link href="/jobs/post?draft=true" className="block rounded-md bg-slate-50 p-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
              Continue a draft posting
            </Link>
            <Link href="/jobs/post" className="block rounded-md bg-slate-50 p-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
              Start a fresh role
            </Link>
          </div>
        </DashboardSection>

        <DashboardSection
          eyebrow="Signals"
          title="Recent activity"
          description="Highlights from today"
        >
          <p className="text-xs text-slate-500">Counts reset daily so you can tell if activity is trending up.</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">New applications today</span>
              <span className="font-semibold">3</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Candidates interviewed</span>
              <span className="font-semibold">1</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Jobs expiring soon</span>
              <span className="font-semibold">0</span>
            </div>
          </div>
        </DashboardSection>
      </section>
    </>
  );
}
