import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GraduationCap, LayoutDashboard, MessageSquare, Sparkles, Briefcase, ClipboardList, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { getUnreadCount } from "@/features/notifications/service";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import { requireSession } from "@/lib/auth/session";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { buildDashboardCoursesUrl } from "@/lib/dashboard-courses-url";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireSession({
    allowedRoles: ["STUDENT"],
    failureMode: "error",
  });

  const unreadCount = await getUnreadCount(session.sub);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <span className="text-lg font-semibold tracking-tight uppercase text-primary">
              {siteConfig.name}
            </span>
            <span className="text-xs text-muted-foreground">Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <NotificationsBell unreadCount={unreadCount} />
            <span className="text-sm text-slate-600 capitalize">
              {session.role.replace("_", " ")}
            </span>
            <Button variant="outline" asChild>
              <Link href="/">Home</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/logout">Logout</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr] xl:grid-cols-[300px_1fr]">
          <DashboardSidebar
            title="Student Hub"
            subtitle="Everything tied to your learning arc sits here—no more scattered cards."
            meta="Focus mode"
            items={[
              {
                label: "Dashboard",
                description: "Overview & quick stats",
                href: "/dashboard",
                icon: LayoutDashboard,
              },
              {
                label: "Courses",
                description: "Browse catalog & enroll",
                href: buildDashboardCoursesUrl(),
                icon: GraduationCap,
              },
              {
                label: "Resumes",
                description: "Create & manage resumes",
                href: "/resumes",
                icon: Sparkles,
              },
              {
                label: "Jobs",
                description: "Find opportunities",
                href: "/jobs",
                icon: Briefcase,
              },
              {
                label: "Applications",
                description: "Track submissions",
                href: "/dashboard/applications",
                icon: ClipboardList,
              },
              {
                label: "Chat",
                description: "Connect with others",
                href: "/chat",
                icon: MessageCircle,
              },
              {
                label: "Messages",
                description: "Notifications & inbox",
                href: "/notifications",
                icon: MessageSquare,
              },
            ]}
            footer={
              <>
                <p className="font-medium text-slate-900">Stuck?</p>
                <p className="text-sm text-slate-600">Join the community forum to get help fast.</p>
                <Link href="/forum" className="mt-2 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700">
                  Go to forum →
                </Link>
              </>
            }
          />
          <div>{children}</div>
        </div>
      </main>
    </div>
  );
}
