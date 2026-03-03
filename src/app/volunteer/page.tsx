import { MapPin, Earth, Users, Heart } from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listVolunteerOpportunities } from "@/features/volunteer/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function VolunteerPage() {
  const opportunities = await listVolunteerOpportunities({ limit: 8 });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-blue-200/60 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 p-8 text-white shadow-2xl">
          <p className="text-xs uppercase tracking-[0.5em] text-white/80">Volunteer network</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <h1 className="text-4xl font-semibold leading-tight">
                Support communities, build experience, unlock new hiring signals.
              </h1>
              <p className="mt-4 text-white/85">
                Mission-led roles curated by tenant admins and employers. Every project is tied to measurable outcomes
                and can convert to part-time or full-time roles.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/80">
                <span className="inline-flex items-center gap-2 rounded-2xl border border-white/30 px-4 py-2">
                  <Heart className="h-4 w-4" /> Mentorship
                </span>
                <span className="inline-flex items-center gap-2 rounded-2xl border border-white/30 px-4 py-2">
                  <Users className="h-4 w-4" /> Cohort support
                </span>
                <span className="inline-flex items-center gap-2 rounded-2xl border border-white/30 px-4 py-2">
                  <Earth className="h-4 w-4" /> Remote-first
                </span>
              </div>
            </div>
            <div className="rounded-3xl bg-white/15 p-6 backdrop-blur">
              <p className="text-sm uppercase tracking-[0.4em] text-white/70">Impact snapshot</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Live roles", value: "48" },
                  { label: "Global NGOs", value: "26" },
                  { label: "Hires from volunteer", value: "62" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-xs text-white/70">{stat.label}</p>
                    <p className="text-2xl font-semibold">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Open roles</h2>
              <p className="text-slate-600">
                Browse roles created by Finbers tenants. Apply to showcase your coaching, storytelling, and leadership
                skills.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">Filter</Button>
              <Button>Request to post</Button>
            </div>
          </div>

          {opportunities.length === 0 ? (
            <Card className="border border-slate-200/80 bg-white/95">
              <CardContent className="py-12 text-center">
                <p className="text-sm text-slate-500">No volunteer roles yet. Check back soon or ask your admin.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {opportunities.map((opportunity) => (
                <Card key={opportunity.id} className="border border-slate-200/80 bg-white/95 shadow-sm transition hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl text-slate-900">{opportunity.title}</CardTitle>
                      <Badge variant={opportunity.isRemote ? "secondary" : "outline"} className="text-xs uppercase">
                        {opportunity.isRemote ? "Remote" : "On-site"}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm text-primary font-semibold">
                      {opportunity.organization}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {opportunity.location}, {opportunity.country}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>{opportunity.commitment ?? "Flexible commitment"}</span>
                    </div>
                    {opportunity.description && (
                      <p className="text-sm text-slate-600 line-clamp-3">{opportunity.description}</p>
                    )}
                    {opportunity.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {opportunity.skills.slice(0, 4).map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {opportunity.skills.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{opportunity.skills.length - 4} more
                          </Badge>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{opportunity._count.applications} applicants</span>
                      <span>Posted {opportunity.createdAt.toLocaleDateString()}</span>
                    </div>
                    <Button size="sm" className="w-full" variant="secondary">
                      Request referral (demo)
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-2">
          <Card className="border border-slate-200/80 bg-white/95">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">How referrals work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <p>Volunteer listings are currently read-only on this public preview.</p>
              <ul className="space-y-2">
                {[
                  "Tenant admins post opportunities tied to cohorts and hiring partners.",
                  "Students or tutors request introductions with a single click.",
                  "Admins forward your resume + portfolio to the receiving org.",
                  "Once launched, you’ll track applications in the dashboard.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="border border-slate-200/80 bg-white/95">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Need a custom role?</CardTitle>
              <CardDescription>Work with Finbers Link to onboard your organization.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-600">
                <p>Add your own NGOs, apprenticeship partners, or civic programs.</p>
                <p className="mt-2 text-xs text-slate-400">
                  Contact support to enable volunteer workflows and referrals in production.
                </p>
              </div>
              <Button className="w-full">Talk to solutions team</Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
