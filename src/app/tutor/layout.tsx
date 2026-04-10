import type { ReactNode } from "react";
import Link from "next/link";

import { Button } from "../../components/ui/button";
import { siteConfig } from "../../config/site";
import { getUnreadCount } from "../../features/notifications/service";
import { NotificationsBell } from "../../components/notifications/notifications-bell";
import { requireSession } from "../../lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TutorLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireSession({
    allowedRoles: ["TUTOR"],
    requireTenant: true,
    failureMode: "error",
  });

  let unreadCount = 0;
  try {
    unreadCount = await getUnreadCount(session.sub);
  } catch (error) {
    console.error("Failed to fetch tutor unread notifications:", error);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/tutor" className="flex items-center space-x-3">
            <span className="text-lg font-semibold tracking-tight uppercase text-primary">
              {siteConfig.name}
            </span>
            <span className="text-xs text-muted-foreground">Tutor</span>
          </Link>
          <div className="flex items-center gap-3">
            <NotificationsBell unreadCount={unreadCount} />
            <span className="text-sm text-slate-600 capitalize">
              {session.role.replace("_", " ")}
            </span>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Student view</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/logout">Logout</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="hidden md:block md:col-span-1">
            <nav className="sticky top-20 space-y-3 rounded-lg border border-slate-100 bg-white p-4">
              <div className="mb-2 px-1 text-xs uppercase tracking-wide text-slate-500">Workspace</div>
              <Link href="/tutor" className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Overview</Link>
              <Link href="/tutor/courses" className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Courses</Link>
              <Link href="/tutor/exams" className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Exams</Link>
              <Link href="/tutor/forums" className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Forums</Link>
              <Link href="/tutor/messages" className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Messages</Link>
              <Link href="/tutor/analytics" className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Analytics</Link>
            </nav>
          </aside>

          {/* Main content */}
          <section className="md:col-span-3">
            {children}
          </section>
        </div>
      </main>
    </div>
  );
}
