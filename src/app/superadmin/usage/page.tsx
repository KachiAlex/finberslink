import { BarChart2, Database, Users } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { StatCard } from "@/components/ui/stat-card";
import { getSuperAdminUsageOverview } from "@/features/superadmin/usage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SuperAdminUsagePage() {
  const { snapshots, totals } = await getSuperAdminUsageOverview();

  return (
    <section className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Active students"
          value={totals.activeStudents.toString()}
          icon={Users}
          variant="minimal"
        />
        <StatCard
          title="Active tutors"
          value={totals.activeTutors.toString()}
          icon={Users}
          variant="minimal"
        />
        <StatCard
          title="Live jobs"
          value={totals.activeJobs.toString()}
          icon={BarChart2}
          variant="minimal"
        />
        <StatCard
          title="Applications"
          value={totals.applications.toString()}
          icon={Database}
          variant="minimal"
        />
      </div>

      <GlassCard variant="bordered" className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Telemetry</p>
            <h2 className="text-2xl font-semibold text-slate-900">Recent tenant usage snapshots</h2>
            <p className="text-sm text-slate-500">Last 12 recorded snapshots across tenants.</p>
          </div>
        </div>

        <div className="mt-6 w-full overflow-auto">
          <table className="w-full min-w-[640px] text-left text-sm text-slate-600">
            <thead className="text-xs uppercase tracking-[0.3em] text-slate-400">
              <tr>
                <th className="py-3 pr-6 font-normal">Tenant</th>
                <th className="py-3 pr-6 font-normal">Period</th>
                <th className="py-3 pr-6 font-normal">Students</th>
                <th className="py-3 pr-6 font-normal">Tutors</th>
                <th className="py-3 pr-6 font-normal">Jobs</th>
                <th className="py-3 pr-6 font-normal">Applications</th>
                <th className="py-3 pr-6 font-normal">Storage (MB)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {snapshots.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-sm text-slate-500">
                    No usage snapshots available yet.
                  </td>
                </tr>
              ) : (
                snapshots.map((snapshot) => (
                  <tr key={snapshot.id}>
                    <td className="py-4 pr-6 font-semibold text-slate-900">
                      {snapshot.tenant?.name ?? "Unknown tenant"}
                    </td>
                    <td className="py-4 pr-6">
                      {snapshot.month.toString().padStart(2, "0")}/{snapshot.year}
                    </td>
                    <td className="py-4 pr-6 font-semibold text-slate-900">{snapshot.activeStudents}</td>
                    <td className="py-4 pr-6 font-semibold text-slate-900">{snapshot.activeTutors}</td>
                    <td className="py-4 pr-6 font-semibold text-slate-900">{snapshot.activeJobs}</td>
                    <td className="py-4 pr-6 font-semibold text-slate-900">{snapshot.applications}</td>
                    <td className="py-4 pr-6 font-semibold text-slate-900">{snapshot.storageUsedMb}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </section>
  );
}
