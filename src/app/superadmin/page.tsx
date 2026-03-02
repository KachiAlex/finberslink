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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total tenants"
          value={overview.stats.totalTenants}
          icon={Building2}
          trend={{ value: 8, isPositive: true }}
          className="bg-gradient-to-br from-white/20 via-white/10 to-transparent text-white"
        />
        <StatCard
          title="Active tenants"
          value={overview.stats.activeTenants}
          icon={GaugeCircle}
          trend={{ value: 5, isPositive: true }}
          className="bg-gradient-to-br from-[#2dd4bf]/30 via-white/10 to-transparent text-white"
        />
        <StatCard
          title="Suspended"
          value={overview.stats.suspendedTenants}
          icon={GaugeCircle}
          trend={{ value: 2, isPositive: false }}
          className="bg-gradient-to-br from-[#f97316]/30 via-white/10 to-transparent text-white"
        />
        <StatCard
          title="Total users"
          value={overview.stats.totalUsers}
          icon={Users}
          trend={{ value: 14, isPositive: true }}
          className="bg-gradient-to-br from-[#a855f7]/30 via-white/10 to-transparent text-white"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <GlassCard className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">Tenant momentum</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Recently updated tenants</h2>
              <p className="text-white/70">Watching usage, seats, and renewals in real time.</p>
            </div>
            <Button variant="ghost" size="sm" className="text-white/80" asChild>
              <a href="/superadmin/tenants" className="inline-flex items-center gap-1">
                Manage tenants <ArrowUpRight className="h-4 w-4" />
              </a>
            </Button>
          </div>

          <div className="mt-6 space-y-4">
            {overview.recentTenants.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                No tenant activity yet. Onboard your first digital school to get started.
              </div>
            ) : (
              overview.recentTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{tenant.name}</p>
                    <p className="text-xs text-white/60">
                      {tenant.planTier.toLowerCase()} · {tenant._count.users} users
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-white/70">
                      {tenant.seatAllocated}/{tenant.seatLimit} seats
                    </div>
                    <Badge
                      variant="outline"
                      className="border-white/30 bg-white/5 text-xs uppercase tracking-wide text-white"
                    >
                      {tenant.status.toLowerCase()}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">License renewals</p>
            <h2 className="text-2xl font-semibold text-white">Upcoming expirations</h2>
          </div>

          <div className="mt-5 space-y-4">
            {overview.renewals.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                No renewals due soon.
              </div>
            ) : (
              overview.renewals.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 to-transparent px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{tenant.name}</p>
                    <p className="text-xs text-white/60">{tenant.planTier.toLowerCase()}</p>
                  </div>
                  <div className="text-right text-xs text-white/60">
                    <p>{tenant.licenseExpiresAt?.toLocaleDateString()}</p>
                    <p className="uppercase">{tenant.status.toLowerCase()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">Usage snapshots</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Recent tenant telemetry</h2>
          </div>
          <Button variant="ghost" size="sm" className="text-white/80" asChild>
            <a href="/superadmin/usage">See all</a>
          </Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {overview.usageSnapshots.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70 md:col-span-2 lg:col-span-3">
              No usage metrics recorded yet.
            </div>
          ) : (
            overview.usageSnapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80"
              >
                <p className="text-xs uppercase tracking-wide text-white/50">
                  {snapshot.year}/{snapshot.month.toString().padStart(2, "0")}
                </p>
                <p className="text-base font-semibold text-white">
                  {snapshot.tenant.name}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-white/70">
                  <div>
                    <p className="font-semibold text-white">{snapshot.activeStudents}</p>
                    <p>Active students</p>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{snapshot.activeJobs}</p>
                    <p>Live jobs</p>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{snapshot.applications}</p>
                    <p>Applications</p>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{snapshot.storageUsedMb}MB</p>
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
