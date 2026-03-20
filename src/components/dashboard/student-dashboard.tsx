import Link from "next/link";
import { ArrowRight, Briefcase, ClipboardList, GraduationCap, LayoutDashboard, MessageSquare, Sparkles } from "lucide-react";

import { DashboardSectionsClient } from "@/app/dashboard/sections-client";
import { Badge } from "@/components/ui/badge";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { buildDashboardCoursesUrl, buildFocusTrackUrl } from "@/lib/dashboard-courses-url";

interface StudentDashboardProps {
  userId: string;
}

export function StudentDashboard(_props: StudentDashboardProps) {
  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr] xl:grid-cols-[300px_1fr]">
      <DashboardSidebar
        title="Student Hub"
        subtitle="Everything tied to your learning arc sits here—no more scattered cards."
        meta="Focus mode"
        items={[
          {
            label: "Mission control",
            description: "Insights & guidance",
            href: "/dashboard",
            icon: LayoutDashboard,
          },
          {
            label: "Courses",
            description: "Browse catalog, assigned tracks & enroll",
            href: buildDashboardCoursesUrl(),
            icon: GraduationCap,
          },
          {
            label: "Resumes",
            description: "Review, download, and share your resumes",
            href: "/dashboard/resume",
            icon: Sparkles,
          },
          {
            label: "Jobs",
            description: "See employer posts and apply fast",
            href: "/jobs",
            icon: Briefcase,
          },
          {
            label: "Applications",
            description: "Track every submission",
            href: "/dashboard/applications",
            icon: ClipboardList,
          },
          {
            label: "Notifications",
            description: "Inbox & nudges",
            href: "/dashboard/notifications",
            icon: MessageSquare,
            badge: "0",
          },
        ]}
        footer={
          <>
            <p className="font-medium text-slate-900">Need momentum?</p>
            <p>Drop into the community forum to unblock questions within minutes.</p>
            <Link href="/forum" className="mt-2 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700">
              Visit forum →
            </Link>
          </>
        }
      />

      <div className="space-y-10">
        <DashboardHero
          eyebrow="Student workspace"
          title="Stay on track and act on opportunities"
          description="Jump back into your active courses or follow up on applications without hunting through menus."
          accent="blue"
          actions={[
            { label: "Continue learning", href: buildDashboardCoursesUrl({ sort: "recent" }), icon: ArrowRight },
            { label: "Explore beginner tracks", href: buildFocusTrackUrl("beginner"), icon: GraduationCap, variant: "secondary" },
            { label: "Review applications", href: "/applications", icon: Briefcase, variant: "secondary" },
          ]}
          metaSlot={
            <div className="flex items-center gap-2 text-slate-700">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <span>Inbox</span>
              <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                0
              </Badge>
            </div>
          }
        />

        <DashboardSectionsClient />
      </div>
    </div>
  );
}
