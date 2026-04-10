"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Briefcase, Users, TrendingUp, CheckCircle } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { Card, CardContent } from "@/components/ui/card";

// Floating Particles Component
const FloatingParticles = () => {
  const [particles, setParticles] = useState<Array<{
    width: number;
    height: number;
    left: number;
    top: number;
    duration: number;
    delay: number;
  }> | null>(null);

  useEffect(() => {
    // Generate particles only on client to avoid hydration mismatch
    setParticles(
      Array.from({ length: 12 }).map(() => ({
        width: Math.random() * 200 + 100,
        height: Math.random() * 200 + 100,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: Math.random() * 20 + 15,
        delay: Math.random() * 5,
      }))
    );
  }, []);

  // Return empty div during SSR to match server render
  if (!particles) {
    return <div className="fixed inset-0 pointer-events-none overflow-hidden" />;
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle, i) => (
        <div
          key={i}
          className="absolute animate-pulse rounded-full bg-gradient-to-r from-green-400/20 to-emerald-400/20 blur-xl"
          style={{
            width: `${particle.width}px`,
            height: `${particle.height}px`,
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            animation: `float ${particle.duration}s ease-in-out infinite`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -20px) scale(1.1); }
          50% { transform: translate(-10px, 50px) scale(0.95); }
          75% { transform: translate(-30px, -10px) scale(1.05); }
        }
      `}</style>
    </div>
  );
};

// Gradient Text Component
const GradientText = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent ${className}`}>
    {children}
  </span>
);

// Enhanced Stat Card with Decorative Elements
const EnhancedStatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  delay = 0,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: { value: number; isPositive: boolean };
  delay?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <Card className="border-0 bg-gradient-to-br from-green-50 via-white to-emerald-50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 group overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover:from-white/15 group-hover:to-white/5 transition-all duration-300 pointer-events-none" />
        <CardContent className="pt-6 pb-4 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 group-hover:text-slate-700">{title}</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mt-1">{value}</p>
            </div>
            <div className="rounded-2xl p-3 bg-green-100 text-green-600 group-hover:scale-110 transition-transform">
              <Icon className="h-6 w-6" />
            </div>
          </div>
          {trend && (
            <div className={`mt-3 text-xs font-semibold ${trend.isPositive ? "text-emerald-600" : "text-red-600"}`}>
              {trend.isPositive ? "↑" : "↓"} {trend.value}%
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

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
      <FloatingParticles />
      <DashboardHero
        eyebrow="Employer workspace"
        title={<>Keep your <GradientText>talent pipeline</GradientText> moving</>}
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 relative z-10">
            <EnhancedStatCard title="Active Jobs" value={insights.jobsPosted} icon={Briefcase} trend={{ value: 12, isPositive: true }} delay={0} />
            <EnhancedStatCard title="Applications" value={insights.applicationsReceived} icon={Users} delay={100} />
            <EnhancedStatCard title="Offers sent" value={insights.offeredCandidates} icon={CheckCircle} delay={200} />
            <EnhancedStatCard title="Conversion Rate" value={`${insights.conversionRate}%`} icon={TrendingUp} trend={{ value: 5, isPositive: true }} delay={300} />
          </div>
        </DashboardSection>
      )}

      <section className="grid gap-6 md:grid-cols-2 relative z-10">
        <DashboardSection
          eyebrow="Actions"
          title={<><GradientText>Keep candidates</GradientText> moving forward</>}
          description="Most frequent steps"
          actions={[{ label: "View all jobs", href: "/employer/jobs", variant: "ghost" }]}
        >
          <p className="text-xs text-slate-500">Stay within these links to knock out the top admin tasks quickly.</p>
          <div className="space-y-2">
            <Link href="/employer/applications" className="block rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 p-4 text-sm font-medium text-slate-700 transition-all duration-300 hover:bg-gradient-to-r hover:from-green-100 hover:to-emerald-100 hover:shadow-md hover:scale-105 border border-green-200/50 hover:border-green-300">
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
