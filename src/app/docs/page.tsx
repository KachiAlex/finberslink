import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const guides = [
  {
    title: "Authentication",
    detail: "Configure JWT secrets, tenant roles, and cookie lifecycles for secure access.",
    href: "/docs/authentication",
  },
  {
    title: "Courses API",
    detail: "Programmatically create cohorts, modules, and tutor assignments via REST.",
    href: "/docs/courses",
  },
  {
    title: "Jobs & Volunteer",
    detail: "Sync job boards, applications, and resume exports with your ATS.",
    href: "/docs/jobs",
  },
];

const sdks = [
  {
    title: "JavaScript SDK",
    snippet: `import { FinbersClient } from "@finbers/sdk";

const client = new FinbersClient({ token: process.env.FINBERS_TOKEN });
const enrollments = await client.courses.listEnrollments({ cohortId: "cohort_123" });`,
  },
  {
    title: "Python SDK",
    snippet: `from finbers import FinbersClient

client = FinbersClient(token=os.environ["FINBERS_TOKEN"])
client.jobs.submit_application({
    "user_id": user_id,
    "opportunity_id": job_id,
})`,
  },
];

export const metadata = {
  title: "Documentation | Finbers Link",
  description: "Product manuals, API references, and SDK quickstarts for Finbers Link.",
};

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950/70 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-16 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-white/15 bg-white/5 px-6 py-10 shadow-[0_30px_80px_rgba(15,23,42,0.55)] backdrop-blur sm:px-10">
          <Badge className="bg-primary/20 text-primary-foreground">Docs</Badge>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight">Build on Finbers Link.</h1>
          <p className="mt-4 max-w-3xl text-lg text-white/80">
            Access implementation guides, API references, and SDK examples to embed Finbers Link data into your LMS, SIS, or HR stack.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-white/15 bg-white/5 text-white shadow-lg shadow-black/25">
            <CardHeader>
              <CardTitle className="text-2xl">Featured guides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {guides.map((guide) => (
                <div key={guide.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-lg font-semibold">{guide.title}</p>
                  <p className="text-sm text-white/70">{guide.detail}</p>
                  <Button variant="ghost" asChild className="mt-3 px-0 text-white hover:bg-transparent">
                    <Link href={guide.href}>Read guide →</Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/15 bg-white/5 text-white shadow-lg shadow-black/25">
            <CardHeader>
              <CardTitle className="text-2xl">SDK quickstarts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {sdks.map((sdk) => (
                <div key={sdk.title} className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 font-mono text-xs text-white/80">
                  <p className="font-sans text-sm font-semibold text-white">{sdk.title}</p>
                  <pre>{sdk.snippet}</pre>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <Tabs defaultValue="rest" className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/25">
          <TabsList className="bg-white/10">
            <TabsTrigger value="rest">REST</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="events">Realtime events</TabsTrigger>
          </TabsList>
          <TabsContent value="rest" className="mt-6 space-y-4 text-sm text-white/80">
            <p>Use JSON REST endpoints with OAuth client credentials or JWT service tokens.</p>
            <pre className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 font-mono text-xs">
              {`PATCH /api/courses/{courseId}
{
  "title": "Impact Storytelling",
  "status": "published"
}`}
            </pre>
          </TabsContent>
          <TabsContent value="webhooks" className="mt-6 space-y-4 text-sm text-white/80">
            <p>Receive webhook notifications for enrollment updates, resume reviews, and job offers.</p>
            <pre className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 font-mono text-xs">
              {`POST /webhooks/finbers
X-Finbers-Signature: sha256=...
{
  "type": "resume.updated",
  "data": {
    "resumeId": "rs_123",
    "status": "ready"
  }
}`}
            </pre>
          </TabsContent>
          <TabsContent value="events" className="mt-6 space-y-4 text-sm text-white/80">
            <p>Stream realtime events over Socket.IO channels to power live dashboards.</p>
            <pre className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 font-mono text-xs">
              {`finbers.subscribe("cohort:progress", (payload) => {
  console.log(payload.userId, payload.progress);
});`}
            </pre>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
