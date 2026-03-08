import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDashboardSummary } from "@/features/dashboard/service";
import { verifyToken } from "@/lib/auth/jwt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { ArrowRight, Briefcase, GraduationCap, MessageSquare, Sparkles } from "lucide-react";
import { DashboardSectionsClient } from "./sections-client";

export const metadata = {
  title: "Finbers Link | Student Dashboard",
  description: "Track your enrollments, resumes, jobs, and applications from a single dashboard.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getUserFromSession() {
  const store = await cookies();
  const accessToken = store.get("access_token")?.value;
  if (!accessToken) return null;
  try {
    return verifyToken(accessToken);
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const user = await getUserFromSession();
  if (!user) {
    redirect("/login");
  }

  const summary = await getDashboardSummary(user.sub);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900">
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-br from-blue-100/70 via-white to-cyan-50 blur-2xl" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <header className="rounded-4xl relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg shadow-slate-200/70">
          <div className="absolute -right-16 top-6 h-48 w-48 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-400/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.45em] text-slate-500">Finbers Link</p>
              <h1 className="mt-3 text-4xl font-semibold text-slate-900 sm:text-5xl">
                Your career command center
              </h1>
              <p className="mt-3 max-w-2xl text-base text-slate-600">
                Track your learning velocity, craft high-converting resumes, and manage every application from a single,
                high-fidelity cockpit.
              </p>
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
              <Button
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-100"
                asChild
              >
                <Link href="/courses" className="flex items-center gap-2">
                  Explore tracks
                </Link>
              </Button>
              <Button
                asChild
                className="rounded-full bg-slate-900 px-5 text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800"
              >
                <Link href="/dashboard/applications" className="flex items-center gap-2 text-sm font-medium">
                  Quick apply <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-sm">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <span>Messages</span>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                  0
                </Badge>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Active Learning Tracks"
            value={summary.enrollmentsCount}
            icon={GraduationCap}
            trend={{ value: 18, isPositive: true }}
            variant="minimal"
          />
          <StatCard
            title="Resumes in Studio"
            value={summary.resumesCount}
            icon={Sparkles}
            trend={{ value: 32, isPositive: true }}
            variant="minimal"
          />
          <StatCard
            title="Opportunities in Motion"
            value={summary.applicationsCount}
            icon={Briefcase}
            trend={{ value: 12, isPositive: true }}
            variant="minimal"
          />
        </section>

        <DashboardSectionsClient />
      </div>
    </main>
  );
}
