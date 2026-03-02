import type { ReactNode } from "react";
import Link from "next/link";
import { Sparkles, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { superAdminNav } from "@/features/superadmin/nav";
import { requireSuperAdminUser } from "@/features/superadmin/service";

import { SuperAdminNavLink } from "./_components/nav-link";

export default async function SuperAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const superAdmin = await requireSuperAdminUser();

  return (
    <div className="relative min-h-screen bg-[#01030c] text-white">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(120,83,255,0.25),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(34,197,203,0.2),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,_rgba(255,255,255,0.04)_1px,_transparent_1px)] bg-[length:200px_200px] opacity-30" />
      </div>

      <div className="mx-auto flex w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <aside className="sticky top-8 hidden h-fit w-72 shrink-0 flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:flex">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.45em] text-white/70">Superadmin</p>
            <div>
              <p className="text-lg font-semibold text-white">
                {superAdmin.firstName} {superAdmin.lastName}
              </p>
              <p className="text-sm text-white/70">{superAdmin.email}</p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-xs font-semibold text-white">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Platform control access
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            {superAdminNav.map((item) => (
              <SuperAdminNavLink
                key={item.href}
                href={item.href}
                title={item.title}
                icon={<item.icon className="h-4 w-4" />}
              />
            ))}
          </nav>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-4 text-xs text-white/70">
            <p className="font-semibold text-white">Need escalation?</p>
            <p>Contact platform engineering or view the incident runbook.</p>
          </div>
        </aside>

        <main className="flex-1 space-y-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-indigo-500/20 backdrop-blur">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-white/70">
                  Finbers Link Control Tower
                </p>
                <h1 className="text-3xl font-semibold text-white">Superadmin Console</h1>
                <p className="text-sm text-white/70">
                  Manage digital school tenants, licensing, and platform-wide feature flags.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="ghost" asChild className="text-white hover:bg-white/10">
                  <Link href="/superadmin/tenants">View tenants</Link>
                </Button>
                <Button className="rounded-full bg-white text-slate-900 shadow-lg">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Launch automation
                  </span>
                </Button>
              </div>
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
