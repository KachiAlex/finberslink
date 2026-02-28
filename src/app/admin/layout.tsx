import type { ReactNode } from "react";
import { Sparkles, ShieldCheck } from "lucide-react";

import { adminNav } from "@/features/admin/nav";
import { getAdminOverview, requireAdminUser } from "@/features/admin/service";
import { getUnreadCount } from "@/features/notifications/service";
import { NotificationsBell } from "@/components/notifications/notifications-bell";

import { AdminNavLink } from "./_components/admin-nav-link";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await requireAdminUser();
  const unreadCount = await getUnreadCount(admin.id);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_55%)]" />
      <div className="mx-auto flex w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <aside className="sticky top-6 hidden h-fit w-72 shrink-0 flex-col gap-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm lg:flex">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-primary">Admin</p>
            <div>
              <p className="text-lg font-semibold text-slate-900">
                {admin.firstName} {admin.lastName}
              </p>
              <p className="text-sm text-slate-500">{admin.email}</p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-slate-900/5 px-3 py-2 text-xs font-semibold text-slate-600">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {admin.role.replace("_", " ")} access
            </div>
          </div>
          <nav className="flex flex-col gap-2">
            {adminNav.map((item) => (
              <AdminNavLink key={item.href} href={item.href} title={item.title} />
            ))}
          </nav>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-xs text-slate-500">
            <p className="font-semibold text-slate-800">Need help?</p>
            <p>Reach out to Finbers solutions team for onboarding playbooks.</p>
          </div>
        </aside>

        <main className="flex-1 space-y-8">
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-primary">Finbers Link Admin</p>
                <h1 className="text-3xl font-semibold text-slate-900">Operational Control Center</h1>
                <p className="text-sm text-slate-600">
                  Monitor learning outcomes, talent pipelines, and employer demand in one workspace.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <NotificationsBell unreadCount={unreadCount} />
                <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-white">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-semibold">Live data synced</span>
                </div>
              </div>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
