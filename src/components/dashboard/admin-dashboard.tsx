"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Briefcase, GraduationCap, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";

interface AdminInsights {
  platformMetrics: {
    totalUsers: number;
    activeUsers: number;
    totalCourses: number;
    activeJobs: number;
  };
}

export function AdminDashboard() {
  const [insights, setInsights] = useState<AdminInsights | null>(null);
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
        <div className="absolute -right-16 top-6 h-48 w-48 rounded-full bg-gradient-to-br from-orange-500/10 to-red-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-slate-500">Finbers Link</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900 sm:text-5xl">
              Admin Console
            </h1>
            <p className="mt-3 max-w-2xl text-base text-slate-600">
              Platform overview, user management, and system metrics.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/users">Manage Users</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/analytics">View Analytics</Link>
            </Button>
          </div>
        </div>
      </header>

      {!loading && insights && (
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={insights.platformMetrics.totalUsers}
            icon={Users}
            trend={{ value: 24, isPositive: true }}
            variant="minimal"
          />
          <StatCard
            title="Active Users (7d)"
            value={insights.platformMetrics.activeUsers}
            icon={Users}
            variant="minimal"
          />
          <StatCard
            title="Published Courses"
            value={insights.platformMetrics.totalCourses}
            icon={GraduationCap}
            variant="minimal"
          />
          <StatCard
            title="Active Jobs"
            value={insights.platformMetrics.activeJobs}
            icon={Briefcase}
            variant="minimal"
          />
        </section>
      )}

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold mb-4">System Management</h3>
          <div className="space-y-2">
            <Link
              href="/admin/users"
              className="block p-3 rounded-md bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors"
            >
              Manage Users
            </Link>
            <Link
              href="/admin/courses"
              className="block p-3 rounded-md bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors"
            >
              Manage Courses
            </Link>
            <Link
              href="/admin/jobs"
              className="block p-3 rounded-md bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors"
            >
              Manage Jobs
            </Link>
            <Link
              href="/admin/settings"
              className="block p-3 rounded-md bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors"
            >
              System Settings
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Recent Metrics
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Signups (last 7 days)</span>
              <span className="font-semibold">+12</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Courses published</span>
              <span className="font-semibold">+3</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Jobs posted</span>
              <span className="font-semibold">+8</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Platform uptime</span>
              <span className="font-semibold">99.9%</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
