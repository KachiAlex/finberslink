"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { BarChart3, GraduationCap, Lock, Unlock, Users, Sparkles, TrendingUp } from "lucide-react";
import { StatCard } from "../ui/stat-card";
import { Badge } from "../ui/badge";
import { DashboardHero } from "./dashboard-hero";
import { DashboardSection } from "./dashboard-section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { getTutorDashboardData } from "../../features/dashboard/service";
import { requireSession } from "../lib/auth/session";

// Floating Particles Component
const FloatingParticles = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-pulse rounded-full bg-gradient-to-r from-purple-400/20 to-pink-400/20 blur-xl"
          style={{
            width: `${Math.random() * 200 + 100}px`,
            height: `${Math.random() * 200 + 100}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${Math.random() * 20 + 15}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
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
  <span className={`bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent ${className}`}>
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
      <Card className="border-0 bg-gradient-to-br from-purple-50 via-white to-pink-50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 group overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover:from-white/15 group-hover:to-white/5 transition-all duration-300 pointer-events-none" />
        <CardContent className="pt-6 pb-4 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 group-hover:text-slate-700">{title}</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mt-1">{value}</p>
            </div>
            <div className="rounded-2xl p-3 bg-purple-100 text-purple-600 group-hover:scale-110 transition-transform">
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

interface TutorDashboardProps {
  userId: string;
}

interface TutorInsights {
  coursesCreated: number;
  studentEnrollments: number;
  avgCompletion: number;
  recentCourses: Array<{
    id: string;
    title: string;
    image: string;
  }>;
}

export function TutorDashboard({ userId: _userId }: TutorDashboardProps) {
  const [insights, setInsights] = useState<TutorInsights | null>(null);
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
        eyebrow="Tutor workspace"
        title={<><GradientText>Run your courses</GradientText> and coaching in one view</>}
        description="Jump back into drafts, check progress, and nudge your cohorts without hopping between tabs."
        accent="purple"
        actions={[
          { label: "Manage courses", href: "/tutor/courses" },
          { label: "Review analytics", href: "/tutor/analytics", variant: "secondary" },
        ]}
      />

      {!loading && insights && (
        <DashboardSection
          eyebrow="Snapshot"
          title="Impact metrics"
          description="Health of your teaching practice"
        >
          <p className="text-xs text-slate-500">Stats roll up the last 30 days across every course you lead.</p>
          <div className="grid gap-4 md:grid-cols-3 relative z-10">
            <EnhancedStatCard title="Courses Published" value={insights.coursesCreated} icon={GraduationCap} delay={0} />
            <EnhancedStatCard title="Student Enrollments" value={insights.studentEnrollments} icon={Users} delay={100} />
            <EnhancedStatCard title="Avg Completion Rate" value={`${insights.avgCompletion}%`} icon={BarChart3} trend={{ value: 8, isPositive: true }} delay={200} />
          </div>
        </DashboardSection>
      )}

      {!loading && insights && insights.recentCourses.length > 0 && (
        <DashboardSection
          eyebrow="Courses"
          title={<><GradientText>Your cohorts</GradientText> - stay close to drafts and approved tracks</>}
          description="Manage all your courses in one place"
          actions={[{ label: "Manage all courses", href: "/tutor/courses", variant: "secondary" }]}
        >
          <p className="text-xs text-slate-500">Courses update in real time as learners finish lessons or admins lock edits.</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 relative z-10">
            {insights.recentCourses.map((course: any, idx: number) => (
              <Link
                key={course.id}
                href={`/tutor/courses/${course.id}`}
                className="group rounded-xl border border-slate-200 bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 p-4 transition-all duration-300 hover:border-purple-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 overflow-hidden relative"
                style={{
                  transitionDelay: `${idx * 50}ms`,
                  animation: `slideIn 0.6s ease-out`,
                }}
              >
                <style>{`
                  @keyframes slideIn {
                    from {
                      opacity: 0;
                      transform: translateY(20px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }
                `}</style>
                <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-purple-300 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="aspect-video mb-3 overflow-hidden rounded-md bg-gradient-to-br from-purple-100 to-pink-100 group-hover:shadow-md transition-shadow">
                  {course.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={course.image} alt={course.title} className="h-full w-full object-cover" />
                  )}
                </div>
                <h3 className="mb-2 font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">{course.title}</h3>
                <div className="mb-2 flex items-center gap-2 text-xs text-slate-600">
                  <Badge variant="outline" className="border-transparent bg-slate-100 text-slate-700 capitalize group-hover:bg-purple-100 group-hover:text-purple-700 transition-colors">
                    {course.approvalStatus ? course.approvalStatus.toLowerCase() : "pending"}
                  </Badge>
                  {course.tutorEditingLocked ? (
                    <span className="flex items-center gap-1 text-rose-600">
                      <Lock className="h-3 w-3" /> Editing locked
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <Unlock className="h-3 w-3" /> Editing open
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  {course.tutorEditingLocked
                    ? "Approved and locked. Contact admin to re-open."
                    : "Click to manage your draft."}
                </p>
              </Link>
            ))}
          </div>
        </DashboardSection>
      )}
    </>
  );
}
