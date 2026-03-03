import { ArrowUpRight, Building2, GaugeCircle, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { StatCard } from "@/components/ui/stat-card";
import { getSuperAdminOverview } from "@/features/superadmin/dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SuperAdminOverviewPage() {
  const overview = await getSuperAdminOverview();

  return (
    <section className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <GlassCard variant="bordered" className="p-5">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Licensing</p>
              <h3 className="text-lg font-semibold text-slate-900">Issue a tenant license</h3>
              <p className="text-sm text-slate-600">Spin up a new digital school workspace with configured seats.</p>
            </div>
            <Button asChild className="w-fit rounded-full bg-slate-900 text-white hover:bg-slate-800">
              <a href="/superadmin/tenants?create=new">Create tenant</a>
            </Button>
          </div>
        </GlassCard>
        <GlassCard variant="bordered" className="p-5">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Controls</p>
              <h3 className="text-lg font-semibold text-slate-900">Suspend or reactivate</h3>
              <p className="text-sm text-slate-600">Pause billing, revoke access, or bring a tenant back online.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild className="border-slate-200 text-slate-700">
                <a href="/superadmin/tenants?suspend=true">Suspend tenant</a>
              </Button>
              <Button variant="outline" size="sm" asChild className="border-emerald-200 text-emerald-700">
                <a href="/superadmin/tenants?reactivate=true">Reactivate</a>
              </Button>
            </div>
          </div>
        </GlassCard>
        <GlassCard variant="bordered" className="p-5">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Compliance</p>
              <h3 className="text-lg font-semibold text-slate-900">Feature flags & guardrails</h3>
              <p className="text-sm text-slate-600">Toggle beta modules, enforce audit visibility, and configure usage caps.</p>
            </div>
            <Button variant="outline" asChild className="w-fit border-slate-200 text-slate-700 hover:bg-slate-100">
              <a href="/superadmin/settings">Open settings</a>
            </Button>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total tenants"
          value={overview.stats.totalTenants}
          icon={Building2}
          trend={{ value: 8, isPositive: true }}
          variant="minimal"
        />
        <StatCard
          title="Active tenants"
          value={overview.stats.activeTenants}
          icon={GaugeCircle}
          trend={{ value: 5, isPositive: true }}
          variant="minimal"
        />
        <StatCard
          title="Suspended"
          value={overview.stats.suspendedTenants}
          icon={GaugeCircle}
          trend={{ value: 2, isPositive: false }}
          variant="minimal"
        />
        <StatCard
          title="Total users"
          value={overview.stats.totalUsers}
          icon={Users}
          trend={{ value: 14, isPositive: true }}
          variant="minimal"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <GlassCard variant="bordered" className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Tenant roster</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Operational tenants</h2>
              <p className="text-slate-600">Monitor seat allocation, plan tiers, and live status for each tenant.</p>
            </div>
            <Button variant="outline" size="sm" className="text-slate-700" asChild>
              <a href="/superadmin/tenants" className="inline-flex items-center gap-1">
                Open roster <ArrowUpRight className="h-4 w-4" />
              </a>
            </Button>
          </div>

          <div className="mt-6 space-y-4">
            {overview.recentTenants.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No tenant activity yet. Onboard your first digital school to get started.
              </div>
            ) : (
              overview.recentTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{tenant.name}</p>
                    <p className="text-xs text-slate-500">
                      {tenant.planTier.toLowerCase()} · {tenant._count.users} users
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-500">
                      {tenant.seatAllocated}/{tenant.seatLimit} seats
                    </div>
                    <Badge
                      variant="outline"
                      className="border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-600"
                    >
                      {tenant.status.toLowerCase()}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard variant="bordered" className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Proactive queue</p>
              <h2 className="text-2xl font-semibold text-slate-900">License expirations & suspensions</h2>
            </div>
            <Badge variant="secondary" className="text-xs uppercase tracking-wide text-slate-600">
              {overview.renewals.length} upcoming
            </Badge>
          </div>

          <div className="space-y-4">
            {overview.renewals.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No renewals due soon.
              </div>
            ) : (
              overview.renewals.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{tenant.name}</p>
                    <p className="text-xs text-slate-500">{tenant.planTier.toLowerCase()}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{tenant.licenseExpiresAt?.toLocaleDateString()}</span>
                    <Badge variant="outline" className="text-xs uppercase tracking-wide text-slate-600">
                      {tenant.status.toLowerCase()}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-slate-200 text-slate-700" asChild>
                      <a href={`/superadmin/tenants/${tenant.id}`}>Adjust license</a>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:bg-slate-100" asChild>
                      <a href={`/superadmin/tenants/${tenant.id}?action=suspend`}>Suspend</a>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

      <GlassCard variant="bordered" className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Usage snapshots</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Recent tenant telemetry</h2>
          </div>
          <Button variant="outline" size="sm" className="text-slate-700" asChild>
            <a href="/superadmin/usage">See all</a>
          </Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {overview.usageSnapshots.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 md:col-span-2 lg:col-span-3">
              No usage metrics recorded yet.
            </div>
          ) : (
            overview.usageSnapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600"
              >
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {snapshot.year}/{snapshot.month.toString().padStart(2, "0")}
                </p>
                <p className="text-base font-semibold text-slate-900">
                  {snapshot.tenant.name}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500">
                  <div>
                    <p className="font-semibold text-slate-900">{snapshot.activeStudents}</p>
                    <p>Active students</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{snapshot.activeJobs}</p>
                    <p>Live jobs</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{snapshot.applications}</p>
                    <p>Applications</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{snapshot.storageUsedMb}MB</p>
                    <p>Storage</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </section>
  );
}
