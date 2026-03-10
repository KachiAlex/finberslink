import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Lock, Server, Users } from "lucide-react";

const controls = [
  {
    icon: ShieldCheck,
    title: "Defense in depth",
    detail: "Containerized services, Web Application Firewall, and automated dependency scanning keep every tenant segmented.",
  },
  {
    icon: Lock,
    title: "Encryption everywhere",
    detail: "TLS 1.3 in transit, AES-256 at rest via managed PostgreSQL + S3 with KMS rotation, and hashed credentials with bcrypt.",
  },
  {
    icon: Users,
    title: "RBAC + audits",
    detail: "Granular roles for students, tutors, admins, and employers with audit events streaming into our monitoring stack.",
  },
  {
    icon: Server,
    title: "Resilience",
    detail: "Daily backups, blue/green deploys, and 30-day point-in-time recovery to meet enterprise uptime targets.",
  },
];

const compliance = [
  {
    label: "SOC 2 Type II",
    description: "Audited controls for security, availability, and confidentiality with annual renewals.",
  },
  {
    label: "GDPR-ready",
    description: "Data Processing Addendum, EU data residency options, and deletion SLAs under 30 days.",
  },
  {
    label: "FERPA alignment",
    description: "Student data minimization, parental consent workflows, and secure transcript exports.",
  },
];

export const metadata = {
  title: "Security | Finbers Link",
  description: "How Finbers Link protects learner data with enterprise-grade security and compliance.",
};

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950/75 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-16 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-white/20 bg-white/5 px-6 py-10 shadow-[0_30px_80px_rgba(15,23,42,0.6)] backdrop-blur sm:px-12">
          <Badge className="bg-emerald-400/20 text-emerald-200">Security</Badge>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">Safeguarding every learner signal.</h1>
          <p className="mt-4 max-w-3xl text-lg text-white/80">
            Finbers Link pairs modern security controls with rigorous compliance so universities, workforce teams, and governments can trust us with their talent pipelines.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {controls.map((control) => (
            <Card key={control.title} className="border-white/15 bg-white/5 text-white shadow-lg shadow-black/25">
              <CardHeader className="flex flex-row items-start gap-4">
                <control.icon className="h-8 w-8 text-emerald-300" />
                <div>
                  <CardTitle className="text-xl font-semibold">{control.title}</CardTitle>
                  <p className="mt-2 text-sm text-white/70">{control.detail}</p>
                </div>
              </CardHeader>
            </Card>
          ))}
        </section>

        <section className="rounded-3xl border border-white/15 bg-white/5 p-8 shadow-xl shadow-black/30">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">Compliance</p>
              <h2 className="mt-3 text-3xl font-semibold">Enterprise proof points.</h2>
              <p className="mt-3 text-white/75">
                Independent audits, strict incident response, and 24/5 security operations support keep stakeholders aligned with procurement requirements.
              </p>
            </div>
            <div className="space-y-6">
              {compliance.map((item, index) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold text-white">{item.label}</p>
                    <Badge variant="secondary" className="bg-white/10 text-white">
                      Control {index + 1}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-white/70">{item.description}</p>
                  {index < compliance.length - 1 && <Separator className="mt-4 border-white/10" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/20 bg-gradient-to-br from-emerald-500/20 via-slate-900 to-slate-900 px-6 py-10 shadow-[0_30px_80px_rgba(15,23,42,0.65)] sm:px-12">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-white/70">Next steps</p>
              <h3 className="mt-4 text-3xl font-semibold">Review the security package.</h3>
              <p className="mt-3 text-white/80">
                We provide shared trust portals with policies, architecture diagrams, and penetration test summaries under NDA.
              </p>
            </div>
            <div className="space-y-3 text-sm text-white/80">
              <p>✔ Vendor security questionnaires returned within 5 business days.</p>
              <p>✔ Incident response drills twice per year.</p>
              <p>✔ Regional data residency available for EU and MENA deployments.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
