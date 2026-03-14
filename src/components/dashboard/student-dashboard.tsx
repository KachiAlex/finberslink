import Link from "next/link";
import { ArrowRight, MessageSquare } from "lucide-react";

import { DashboardSectionsClient } from "@/app/dashboard/sections-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface StudentDashboardProps {
  userId: string;
}

export function StudentDashboard(_props: StudentDashboardProps) {
  return (
    <>
      <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg shadow-slate-200/70">
        <div className="absolute -right-16 top-6 h-48 w-48 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-slate-500">Finbers Link</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900 sm:text-5xl">Your learning dashboard</h1>
            <p className="mt-3 max-w-2xl text-base text-slate-600">
              Track your course progress, manage your resume, and explore job opportunities.
            </p>
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-100" asChild>
              <Link href="/courses" className="flex items-center gap-2">
                Explore courses
              </Link>
            </Button>
            <Button asChild className="rounded-full bg-slate-900 px-5 text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800">
              <Link href="/jobs" className="flex items-center gap-2 text-sm font-medium">
                Find jobs <ArrowRight className="h-4 w-4" />
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

      <DashboardSectionsClient />
    </>
  );
}
