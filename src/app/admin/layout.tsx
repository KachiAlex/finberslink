import type { ReactNode } from "react";
import { Sparkles, ShieldCheck } from "lucide-react";

import { adminNav } from "@/features/admin/nav";
import { requireAdminUser } from "@/features/admin/service";
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
    <div className="relative min-h-screen bg-[#020512] text-white">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(92,60,255,0.25),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(32,226,203,0.2),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,_rgba(255,255,255,0.06)_1px,_transparent_1px)] bg-[length:180px_180px] opacity-30" />
      </div>
      <div className="mx-auto flex w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <aside className="sticky top-6 hidden h-fit w-72 shrink-0 flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur lg:flex">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Admin</p>
            <div>
              <p className="text-lg font-semibold text-white">
                {admin.firstName} {admin.lastName}
              </p>
              <p className="text-sm text-white/70">{admin.email}</p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-xs font-semibold text-white/80">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              {admin.role.replace("_", " ")} access
            </div>
          </div>
          <nav className="flex flex-col gap-2">
            {adminNav.map((item) => (
              <AdminNavLink
                key={item.href}
                href={item.href}
                title={item.title}
                icon={<item.icon className="h-4 w-4" />}
              />
            ))}
          </nav>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
            <p className="font-semibold text-white">Need help?</p>
            <p>Reach out to Finbers solutions team for onboarding playbooks.</p>
          </div>
        </aside>

        <main className="flex-1 space-y-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-white/60">Finbers Link Admin</p>
                <h1 className="text-3xl font-semibold text-white">Operational Control Center</h1>
                <p className="text-sm text-white/70">
                  Monitor learning outcomes, talent pipelines, and employer demand in one workspace.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <NotificationsBell unreadCount={unreadCount} />
                <div className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2 text-white shadow-[0_0_30px_rgba(99,102,241,0.35)]">
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
