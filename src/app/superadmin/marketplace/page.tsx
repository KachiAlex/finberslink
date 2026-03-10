import { ArrowRight, Gift, Sparkles } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { requireSuperAdminSession } from "@/features/superadmin/auth";
import { enableMarketplaceBundle, listMarketplaceBundles } from "@/features/superadmin/marketplace";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function enableBundleAction(formData: FormData) {
  "use server";

  await requireSuperAdminSession();
  const bundleKey = String(formData.get("bundleKey") ?? "");
  if (!bundleKey) return;

  await enableMarketplaceBundle(bundleKey);
}

export default function SuperAdminMarketplacePage() {
  const marketplaceBundles = listMarketplaceBundles();

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Marketplace</p>
        <h1 className="text-3xl font-semibold text-slate-900">Expand platform services</h1>
        <p className="text-sm text-slate-500">
          Review curated add-ons, enable new bundles, and assign offerings to tenants instantly.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-3">
        {marketplaceBundles.map((bundle) => (
          <GlassCard key={bundle.key} variant="bordered" className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">{bundle.badge}</span>
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
            <h2 className="mt-3 text-xl font-semibold text-slate-900">{bundle.title}</h2>
            <p className="mt-2 text-sm text-slate-500">{bundle.description}</p>
            <p className="mt-4 text-lg font-semibold text-slate-900">{bundle.price}</p>
            <form action={enableBundleAction} className="mt-6">
              <input type="hidden" name="bundleKey" value={bundle.key} />
              <Button
                type="submit"
                className="w-full justify-between"
                variant={bundle.enabled ? "secondary" : "outline"}
              >
                <span>{bundle.enabled ? "Enabled" : "Enable bundle"}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </GlassCard>
        ))}
      </div>

      <GlassCard variant="bordered" className="p-6">
        <h2 className="text-xl font-semibold text-slate-900">Partner catalog</h2>
        <p className="text-sm text-slate-500">Connect to approved partners for content, assessments, and job boards.</p>
        <div className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-semibold text-slate-900">Course Marketplace</p>
            <p>Push curated course bundles to tenants with sample curricula.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-semibold text-slate-900">Talent Partnerships</p>
            <p>Match graduating students with verified employers in the network.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-semibold text-slate-900">Assessment Pods</p>
            <p>Spin up AI+human exam pods for certification programs.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-semibold text-slate-900">Automation Marketplace</p>
            <p>Create and sell automation recipes built on the platform.</p>
          </div>
        </div>
      </GlassCard>
    </section>
  );
}
