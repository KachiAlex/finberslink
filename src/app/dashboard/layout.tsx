import type { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { verifyToken } from "@/lib/auth/jwt";
import { getUnreadCount } from "@/features/notifications/service";
import { NotificationsBell } from "@/components/notifications/notifications-bell";

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

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getUserFromSession();
  if (!user) {
    redirect("/login");
  }

  const unreadCount = await getUnreadCount(user.sub);

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
              {user.role.replace("_", " ")}
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
      <main>{children}</main>
    </div>
  );
}
