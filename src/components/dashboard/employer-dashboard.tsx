"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, Users, TrendingUp, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";

interface EmployerDashboardProps {
  userId: string;
}

interface EmployerInsights {
  jobsPosted: number;
  applicationsReceived: number;
  offeredCandidates: number;
  conversionRate: number;
}

export function EmployerDashboard({ userId }: EmployerDashboardProps) {
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
      <header className="rounded-4xl relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg shadow-slate-200/70">
        <div className="absolute -right-16 top-6 h-48 w-48 rounded-full bg-gradient-to-br from-green-500/10 to-emerald-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-slate-500">Finbers Link</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900 sm:text-5xl">
              Hiring Dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-base text-slate-600">
              Post jobs, manage applications, and hire top talent.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              asChild
              className="rounded-full bg-green-600 px-5 text-white shadow-lg shadow-green-600/20 hover:bg-green-700"
            >
              <Link href="/jobs/post" className="text-sm font-medium">
                Post Job
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/employer/applications">View Applications</Link>
            </Button>
          </div>
        </div>
      </header>

      {!loading && insights && (
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Jobs"
            value={insights.jobsPosted}
            icon={Briefcase}
            trend={{ value: 12, isPositive: true }}
            variant="minimal"
          />
          <StatCard
            title="Applications"
            value={insights.applicationsReceived}
            icon={Users}
            variant="minimal"
          />
          <StatCard
            title="Offers sent"
            value={insights.offeredCandidates}
            icon={CheckCircle}
            variant="minimal"
          />
          <StatCard
            title="Conversion Rate"
            value={`${insights.conversionRate}%`}
            icon={TrendingUp}
            variant="minimal"
          />
        </section>
      )}

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link
              href="/jobs/post"
              className="block p-3 rounded-md bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors"
            >
              Post a new job
            </Link>
            <Link
              href="/employer/applications"
              className="block p-3 rounded-md bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors"
            >
              Review applications
            </Link>
            <Link
              href="/employer/jobs"
              className="block p-3 rounded-md bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors"
            >
              Manage your jobs
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
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
        </div>
      </section>
    </>
  );
}
