"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Briefcase, GraduationCap, Shield } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

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
      <DashboardHero
        eyebrow="Admin workspace"
        title="Keep the network healthy"
        description="Spot platform issues, unblock tutors, and review usage signals from one place."
        accent="orange"
        actions={[
          { label: "Review usage", href: "/admin/analytics" },
          { label: "Manage users", href: "/admin/users", variant: "secondary" },
        ]}
        metaSlot={
          <div className="flex items-center gap-2 text-slate-700">
            <Shield className="h-4 w-4 text-amber-600" />
            <span>Super admin</span>
          </div>
        }
      />

      {!loading && insights && (
        <DashboardSection
          eyebrow="Platform signals"
          title="Network overview"
          description="Key usage and supply indicators"
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Users" value={insights.platformMetrics.totalUsers} icon={Users} trend={{ value: 24, isPositive: true }} variant="minimal" />
            <StatCard title="Active Users (7d)" value={insights.platformMetrics.activeUsers} icon={Users} variant="minimal" />
            <StatCard title="Published Courses" value={insights.platformMetrics.totalCourses} icon={GraduationCap} variant="minimal" />
            <StatCard title="Active Jobs" value={insights.platformMetrics.activeJobs} icon={Briefcase} variant="minimal" />
          </div>
        </DashboardSection>
      )}

      <section className="grid gap-6 md:grid-cols-2">
        <DashboardSection
          eyebrow="Control center"
          title="System management"
          description="Jump to operational queues"
          actions={[{ label: "Open analytics", href: "/admin/analytics", variant: "ghost" }]}
        >
          <div className="space-y-2">
            <Link href="/admin/users" className="block rounded-md bg-slate-50 p-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
              Manage Users
            </Link>
            <Link href="/admin/courses" className="block rounded-md bg-slate-50 p-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
              Manage Courses
            </Link>
            <Link href="/admin/jobs" className="block rounded-md bg-slate-50 p-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
              Manage Jobs
            </Link>
            <Link href="/admin/settings" className="block rounded-md bg-slate-50 p-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
              System Settings
            </Link>
          </div>
        </DashboardSection>

        <DashboardSection
          eyebrow="Signals"
          title="Recent metrics"
          description="Realtime health checks"
          actions={[{ label: "Open system panel", href: "/admin/system", variant: "ghost" }]}
        >
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
        </DashboardSection>
      </section>
    </>
  );
}
