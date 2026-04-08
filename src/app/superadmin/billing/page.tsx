import { Badge, CreditCard, Users } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { StatCard } from "@/components/ui/stat-card";
import { getSuperAdminBillingOverview } from "@/features/superadmin/billing";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SuperAdminBillingPage() {
  const { tenants, totals } = await getSuperAdminBillingOverview();
  const upcoming = tenants.filter((tenant) => tenant.licenseExpiresAt).slice(0, 5);

  return (
    <section className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Seat utilization"
          value={`${totals.seatAllocated}/${totals.seatLimit}`}
          icon={Users}
          variant="minimal"
        />
        <StatCard
          title="Tenants tracked"
          value={tenants.length.toString()}
          icon={CreditCard}
          variant="minimal"
        />
        <StatCard
          title="Renewals due"
          value={upcoming.length.toString()}
          icon={Badge}
          variant="minimal"
        />
      </div>

      <GlassCard variant="bordered" className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Billing roster</p>
            <h2 className="text-2xl font-semibold text-slate-900">Upcoming renewals</h2>
          </div>
        </div>

        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-500">No renewals scheduled yet.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((tenant) => (
              <div
                key={tenant.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{tenant.name}</p>
                  <p className="text-xs text-slate-500">
                    {tenant.planTier} · Seats {tenant.seatAllocated}/{tenant.seatLimit}
                  </p>
                </div>
                <div className="text-xs text-slate-500">
                  {tenant.licenseExpiresAt ? new Date(tenant.licenseExpiresAt).toLocaleDateString() : "—"}
                </div>
                <Badge variant="outline" className="text-xs uppercase tracking-[0.35em]">
                  {tenant.status.toLowerCase()}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </section>
  );
}
