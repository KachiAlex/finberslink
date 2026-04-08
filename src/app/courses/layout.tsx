import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GraduationCap, LayoutDashboard, MessageCircle, Sparkles, Briefcase, User } from "lucide-react";

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

export default async function CoursesLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Courses are completely gated - require authentication
  let session = null;
  try {
    // Use strict session check but allow multiple roles
    session = await requireSession({
      allowedRoles: ["STUDENT", "TUTOR", "EMPLOYER", "ADMIN", "SUPER_ADMIN"],
      failureMode: "redirect", // Redirect to login if not authenticated
      redirectTo: "/login?reason=courses-required"
    });
  } catch (error) {
    // This will only execute if redirect fails, handle gracefully
    console.error("[courses-layout] Authentication required:", error);
    redirect("/login?reason=courses-required");
  }

  // User is authenticated, show dashboard-style header
  let unreadCount = 0;
  try {
    unreadCount = await getUnreadCount(session.sub);
  } catch (error) {
    console.error("Failed to fetch unread count:", error);
  }
  
  // Fetch user data for personalized greeting
  let userName: string | null = null;
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { firstName: true, lastName: true }
    });
    userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : null;
  } catch (error) {
    console.error("Failed to fetch user data:", error);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <span className="text-lg font-semibold tracking-tight uppercase text-primary">
              {siteConfig.name}
            </span>
            <span className="text-xs text-muted-foreground">Courses</span>
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
      <main className="relative">
        <CurrentUserProvider userId={session.sub}>
          {children}
        </CurrentUserProvider>
      </main>
    </div>
  );
}

// Public header for unauthenticated users
function PublicSiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-white/70 backdrop-blur-xl transition-all duration-300">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center">
          <img
            src="/finbers-logo.png"
            alt="Finbers Link logo"
            width={140}
            height={36}
            className="h-9 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-4 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-muted-foreground md:flex">
          <Link
            href="/courses"
            className="relative px-2 py-1 transition-colors duration-200 text-primary"
          >
            Courses
          </Link>
        </nav>

        <div className="flex items-center">
          <Button asChild className="px-5">
            <Link href="/signin">Sign in</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
