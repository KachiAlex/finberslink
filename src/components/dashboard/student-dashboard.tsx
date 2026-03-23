import { BookOpen, Trophy, Zap, ArrowRight, Star } from "lucide-react";
import Link from "next/link";

import { DashboardSectionsClient } from "@/app/dashboard/sections-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface StudentDashboardProps {
  userId: string;
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  accent,
  bgGradient,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  accent: string;
  bgGradient: string;
}) => (
  <Card className={`border-0 ${bgGradient} shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1`}>
    <CardContent className="pt-8 pb-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className={`rounded-2xl p-4 ${accent} shadow-lg`}>
          <Icon className="h-7 w-7" />
        </div>
        <div>
          <p className="text-4xl font-bold text-slate-900">{value}</p>
          <p className="text-sm font-medium text-slate-600">{label}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const CourseCard = ({
  title,
  enrolled,
  rating,
}: {
  title: string;
  enrolled: number;
  rating: number;
}) => (
  <Card className="border-0 bg-white shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 overflow-hidden group">
    <div className="h-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 group-hover:from-blue-600 group-hover:via-cyan-600 group-hover:to-emerald-600 transition-colors" />
    <CardContent className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">{title}</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-slate-600">{enrolled}</span>
              <span className="text-xs text-slate-500">students</span>
            </div>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: rating }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
          </div>
        </div>
        <div className="pl-4">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
            <ArrowRight className="h-5 w-5" />
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
);

export function StudentDashboard(_props: StudentDashboardProps) {
  return (
    <div className="space-y-10">
      {/* Promotional Banner - Enhanced */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white shadow-2xl">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -left-40 -bottom-40 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>
        <div className="relative z-10 grid gap-8 p-8 md:grid-cols-2 md:items-center md:p-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-widest text-cyan-300">Featured Opportunity</span>
            </div>
            <h3 className="text-3xl font-bold leading-tight md:text-4xl">
              Self-Paced Agile Virtual Certifications
            </h3>
            <p className="text-lg text-blue-100">
              Earn industry-recognized credentials from expert-led sessions at your own pace.
            </p>
            <ul className="space-y-3 pt-2">
              <li className="flex items-center gap-3 text-blue-100">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400/20">
                  <span className="text-sm font-bold text-cyan-300">✓</span>
                </div>
                Agile certification prep
              </li>
              <li className="flex items-center gap-3 text-blue-100">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400/20">
                  <span className="text-sm font-bold text-cyan-300">✓</span>
                </div>
                Industry recognized credentials
              </li>
              <li className="flex items-center gap-3 text-blue-100">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400/20">
                  <span className="text-sm font-bold text-cyan-300">✓</span>
                </div>
                Expert-led sessions
              </li>
            </ul>
          </div>
          <div className="flex flex-col items-start gap-4 md:items-end">
            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-md border border-white/20">
              <p className="text-sm font-semibold uppercase tracking-widest text-cyan-300 mb-2">Get in Touch</p>
              <p className="text-2xl font-bold mb-1">+234 803 655 5555</p>
              <p className="text-sm text-blue-200">CYBSECURITY@FINBERSGROUP.COM</p>
            </div>
            <Button asChild className="bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg hover:shadow-xl transition-all">
              <Link href="/dashboard/courses" className="gap-2">
                Explore Certifications <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Greeting Section */}
      <div className="space-y-6">
        <div className="flex items-end gap-6">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-blue-400 via-cyan-400 to-emerald-400 opacity-75 blur" />
            <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 via-cyan-500 to-emerald-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
              F
            </div>
          </div>
          <div className="pb-2">
            <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Welcome back</p>
            <h1 className="text-4xl font-bold text-slate-900">Finbers</h1>
          </div>
        </div>
        <p className="text-slate-600">Continue your learning journey and unlock new opportunities.</p>
      </div>

      {/* Enhanced Stats Cards with Multi-Color Palette */}
      <div className="grid gap-6 sm:grid-cols-3">
        <StatCard
          icon={BookOpen}
          label="Enrolled Courses"
          value="0"
          accent="bg-blue-100 text-blue-600"
          bgGradient="bg-gradient-to-br from-blue-50 via-white to-blue-50"
        />
        <StatCard
          icon={Zap}
          label="Active Courses"
          value="0"
          accent="bg-amber-100 text-amber-600"
          bgGradient="bg-gradient-to-br from-amber-50 via-white to-amber-50"
        />
        <StatCard
          icon={Trophy}
          label="Completed Courses"
          value="0"
          accent="bg-emerald-100 text-emerald-600"
          bgGradient="bg-gradient-to-br from-emerald-50 via-white to-emerald-50"
        />
      </div>

      {/* My Courses Section - Enhanced Grid Layout */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">My Learning Path</h2>
            <p className="mt-1 text-sm text-slate-600">Continue where you left off or start something new</p>
          </div>
          <Link href="/dashboard/courses">
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all">
              View All Courses <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Course Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <CourseCard title="Infodemic Management" enrolled={0} rating={5} />
          <CourseCard title="Process Improvement (Result driven course)" enrolled={23} rating={5} />
          <CourseCard title="Soft Skill Course (In conjunction with HCPA) - Cynthia Eguozuwa" enrolled={147} rating={5} />
          <CourseCard title="Test Course" enrolled={0} rating={5} />
        </div>

        {/* Empty State CTA */}
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-blue-50 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No courses yet?</h3>
          <p className="text-slate-600 mb-6">Discover our comprehensive catalog and start your learning journey today.</p>
          <Link href="/dashboard/courses">
            <Button className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md hover:shadow-lg transition-all">
              Browse Course Catalog <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Sections Client for Dynamic Content */}
      <DashboardSectionsClient />
    </div>
  );
}
