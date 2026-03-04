import type { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { Sparkles, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { superAdminNav } from "@/features/superadmin/nav";
import { requireSuperAdminUser } from "@/features/superadmin/service";
import { verifyToken } from "@/lib/auth/jwt";

import { SuperAdminNavLink } from "./_components/nav-link";

export default async function SuperAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const store = await cookies();
  const accessToken = store.get("access_token")?.value;

  if (!accessToken) {
    throw new Error("Not authorized");
  }

  const payload = verifyToken(accessToken);
  const superAdmin = await requireSuperAdminUser(payload.sub);

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900">
      <div className="absolute inset-0 -z-10 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.12),_transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(14,165,233,0.1),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,_rgba(148,163,184,0.15)_1px,_transparent_1px)] bg-[length:220px_220px]" />
      </div>

      <div className="mx-auto flex w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <aside className="sticky top-8 hidden h-fit w-72 shrink-0 flex-col gap-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur lg:flex">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.45em] text-slate-500">Superadmin</p>
            <div>
              <p className="text-lg font-semibold text-slate-900">
                {superAdmin.firstName} {superAdmin.lastName}
              </p>
              <p className="text-sm text-slate-500">{superAdmin.email}</p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
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

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
            <p className="font-semibold text-slate-900">Need escalation?</p>
            <p>Contact platform engineering or view the incident runbook.</p>
          </div>
        </aside>

        <main className="flex-1 space-y-8">
          <div className="rounded-3xl border border-white shadow-lg shadow-indigo-100 bg-white p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-slate-400">
                  Finbers Link Control Tower
                </p>
                <h1 className="text-3xl font-semibold text-slate-900">Superadmin Console</h1>
                <p className="text-sm text-slate-600">
                  Manage digital school tenants, licensing, and platform-wide feature flags.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" asChild className="border-slate-200 text-slate-700 hover:bg-slate-100">
                  <Link href="/superadmin/tenants">View tenants</Link>
                </Button>
                <Button
                  variant="ghost"
                  asChild
                  className="text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  <Link href="/logout">Log out</Link>
                </Button>
                <Button className="rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800">
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
