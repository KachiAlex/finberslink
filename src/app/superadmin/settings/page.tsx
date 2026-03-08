import { CheckCircle, ShieldCheck, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const featureFlags = [
  { key: "aiCourseQa", label: "AI Course QA", description: "Run AI-driven pre-flight checks on syllabi prior to publication.", enabled: true },
  { key: "jobAutoSync", label: "Job board auto-sync", description: "Mirror approved jobs to partner marketplaces automatically.", enabled: false },
  { key: "guardianMode", label: "Guardian monitoring", description: "Enable extra fraud detection for tutor payouts and employer invites.", enabled: true },
];

export default function SuperAdminSettingsPage() {
  return (
    <section className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Settings</p>
        <h1 className="text-3xl font-semibold text-slate-900">Platform defaults</h1>
        <p className="text-sm text-slate-500">Control feature flag defaults, approvals, and automation guardrails.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard variant="bordered" className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Security & access</p>
              <p className="text-xs text-slate-500">Require MFA on superadmin/session-sensitive flows.</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <p>Access policy: <strong>Strict</strong></p>
            <p>Enforced sessions: 24 hours</p>
          </div>
          <Button variant="outline">Review policy</Button>
        </GlassCard>

        <GlassCard variant="bordered" className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-5 w-5 text-slate-500" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Automation guardrails</p>
              <p className="text-xs text-slate-500">Define approvals for automation + marketplace changes.</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Automation approvals must be signed-off by 2+ superadmins.
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Marketplace deployments locked to trusted partners.
            </li>
          </ul>
          <Button variant="outline">Adjust guardrails</Button>
        </GlassCard>
      </div>

      <GlassCard variant="bordered" className="space-y-4 p-6">
        <p className="text-sm font-semibold text-slate-900">Feature flag overrides</p>
        <div className="space-y-4 text-sm">
          {featureFlags.map((flag) => (
            <div key={flag.key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{flag.label}</p>
                <p className="text-xs text-slate-500">{flag.description}</p>
              </div>
              <Button size="sm" variant={flag.enabled ? "secondary" : "ghost"}>
                {flag.enabled ? "Enabled" : "Disabled"}
              </Button>
            </div>
          ))}
        </div>
      </GlassCard>
    </section>
  );
}
