import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { getUnreadCount } from "@/features/notifications/service";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import { ChatAvatar } from "@/components/chat/chat-avatar";
import { requireSession } from "@/lib/auth/session";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { CurrentUserProvider } from "@/components/current-user-provider";
import { buildDashboardCoursesUrl } from "@/lib/dashboard-courses-url";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireSession({
    allowedRoles: ["STUDENT", "TUTOR", "EMPLOYER", "ADMIN", "SUPER_ADMIN"],
    failureMode: "error",
  });

  let unreadCount = 0;
  try {
    unreadCount = await getUnreadCount(session.sub);
  } catch (error) {
    console.error("Failed to fetch unread count:", error);
  }
  
  // Fetch user data for personalized greeting
  let userName: string | null = null;
  try {
    if (session.sub) {
      const user = await prisma.user.findUnique({
        where: { id: session.sub },
        select: { firstName: true, lastName: true }
      });
      userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : null;
    }
  } catch (error) {
    console.error("Failed to fetch user data:", error);
  }

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
          <div className="flex items-center gap-6">
            {userName && (
              <span className="text-sm font-medium text-slate-700">
                Welcome, <span className="font-semibold text-slate-900">{userName}</span>
              </span>
            )}
            <ChatAvatar initialUnreadCount={unreadCount} />
            <NotificationsBell unreadCount={0} />
            <span className="text-sm text-slate-600 capitalize">
              {session.role?.replace("_", " ") ?? ""}
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
        <div className="grid gap-8 lg:grid-cols-[260px_1fr] xl:grid-cols-[300px_1fr] h-[calc(100vh-120px)]">
          <div className="sticky top-0 h-fit">
            <DashboardSidebar
              title="Dashboard"
              subtitle="Your personalized workspace."
              items={[
                { label: "Overview", description: "Manage your progress and tasks.", href: "/dashboard" },
                { label: "Insights & Guidance", description: "Get tips and recommendations.", href: "/dashboard#insights-guidance" },
                { label: "Courses", description: "Browse courses, view assigned tracks, and enroll.", href: buildDashboardCoursesUrl() },
                { label: "Resumes", description: "View, download, or share your resumes.", href: "/dashboard/resumes" },
                { label: "Jobs", description: "Find job posts and apply quickly.", href: "/dashboard/jobs" },
                { label: "Chat", description: "Message with tutors and peers.", href: "/dashboard/chat" },
                { label: "Profile", description: "View and edit your personal profile.", href: "/dashboard/profile" },
              ]}
              footer={
                <>
                  <p className="font-medium text-slate-900">Need help?</p>
                  <p className="text-sm text-slate-600">Visit the community forum to get answers quickly.</p>
                  <Link href="/forum" className="mt-2 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700">
                    Go to Forum →
                  </Link>
                </>
              }
            />
          </div>
          <CurrentUserProvider userId={session.sub}>
            <div className="overflow-y-auto pr-4">{children}</div>
          </CurrentUserProvider>
        </div>
      </main>
    </div>
  );
}
