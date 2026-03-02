import { revalidatePath } from "next/cache";
import { BriefcaseBusiness, Building2, Rocket, Sparkles } from "lucide-react";

type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
type RemoteOption = 'REMOTE' | 'HYBRID' | 'ONSITE';

const JobTypeValues = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'] as const;
const RemoteOptionValues = ['REMOTE', 'HYBRID', 'ONSITE'] as const;

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { Textarea } from "@/components/ui/textarea";
import {
  createJobPosting,
  getJobManagementSnapshot,
  listAdminJobs,
  requireAdminUser,
  updateJobVisibility,
} from "@/features/admin/service";

import { AdminShell } from "../_components/admin-shell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function createJobAction(formData: FormData) {
  "use server";

  await requireAdminUser();

  const title = String(formData.get("title") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const jobType = String(formData.get("jobType") ?? "").toUpperCase() as JobType;
  const remoteOption = String(formData.get("remoteOption") ?? "").toUpperCase() as RemoteOption;

  if (!title || !company || !location || !country) {
    return;
  }

  await createJobPosting({
    title,
    company,
    location,
    country,
    jobType,
    remoteOption,
  });

  revalidatePath("/admin/jobs");
}

async function toggleJobAction(formData: FormData) {
  "use server";

  await requireAdminUser();

  const jobId = String(formData.get("jobId") ?? "");
  const field = String(formData.get("field") ?? "");
  const value = formData.get("value");

  if (!jobId || !field) return;

  await updateJobVisibility(jobId, {
    [field]: value === "true",
  });

  revalidatePath("/admin/jobs");
}

export default async function AdminJobsPage() {
  const [admin, jobs, snapshot] = await Promise.all([
    requireAdminUser(),
    listAdminJobs(),
    getJobManagementSnapshot(),
  ]);

  const statCards = [
    {
      title: "Active roles",
      value: snapshot.totals.activeJobs,
      icon: BriefcaseBusiness,
      trend: { value: 5, isPositive: true },
    },
    {
      title: "Featured slots",
      value: snapshot.totals.featuredJobs,
      icon: Sparkles,
      trend: { value: 2, isPositive: true },
    },
    {
      title: "Drafts & reviews",
      value: snapshot.totals.inactiveJobs,
      icon: Building2,
      trend: { value: 3, isPositive: false },
    },
    {
      title: "Total pipeline",
      value: snapshot.totals.totalJobs,
      icon: Rocket,
      trend: { value: 9, isPositive: true },
    },
  ] as const;

  const liveJobs = jobs.filter((job) => job.isActive);
  const pendingJobs = jobs.filter((job) => !job.isActive);
  const featuredJobs = jobs.filter((job) => job.featured);

  return (
    <div className="space-y-8">
      <AdminShell
        title="Jobs"
        description="Post and manage employer opportunities with type and remote preferences."
        actions={<Badge variant="secondary">{admin.role.replace("_", " ")} access</Badge>}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              trend={stat.trend}
              className="bg-gradient-to-br from-white to-slate-50"
            />
          ))}
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.35fr_0.65fr]">
          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">Live board</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">Active</p>
                    <Badge variant="secondary">{liveJobs.length}</Badge>
                  </div>
                  <div className="mt-4 space-y-3">
                    {liveJobs.map((job) => (
                      <div key={job.id} className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{job.title}</p>
                            <p className="text-xs text-slate-500">{job.company} · {job.location}</p>
                          </div>
                          {job.featured ? (
                            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                              featured
                            </Badge>
                          ) : null}
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                          <span className="capitalize">{job.jobType.toLowerCase().replace("_", " ")}</span>
                          <span>{job._count?.applications ?? 0} applications</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                          <span>Remote: {job.remoteOption.toLowerCase()}</span>
                          <span>
                            {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(job.createdAt)}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <form action={toggleJobAction}>
                            <input type="hidden" name="jobId" value={job.id} />
                            <input type="hidden" name="field" value="isActive" />
                            <input type="hidden" name="value" value="false" />
                            <Button size="xs" variant="outline">
                              Pause
                            </Button>
                          </form>
                          <form action={toggleJobAction}>
                            <input type="hidden" name="jobId" value={job.id} />
                            <input type="hidden" name="field" value="featured" />
                            <input type="hidden" name="value" value={(!job.featured).toString()} />
                            <Button size="xs" variant={job.featured ? "secondary" : "outline"}>
                              {job.featured ? "Remove highlight" : "Promote"}
                            </Button>
                          </form>
                        </div>
                      </div>
                    ))}
                    {liveJobs.length === 0 && (
                      <p className="text-sm text-slate-500">No roles are currently live.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">Drafts / Review</p>
                    <Badge variant="outline">{pendingJobs.length}</Badge>
                  </div>
                  <div className="mt-4 space-y-3">
                    {pendingJobs.map((job) => (
                      <div key={job.id} className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{job.title}</p>
                            <p className="text-xs text-slate-500">{job.company} · {job.location}</p>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {job.jobType.toLowerCase().replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="mt-3 text-xs text-slate-500">Remote: {job.remoteOption.toLowerCase()}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <form action={toggleJobAction}>
                            <input type="hidden" name="jobId" value={job.id} />
                            <input type="hidden" name="field" value="isActive" />
                            <input type="hidden" name="value" value="true" />
                            <Button size="xs">
                              Launch
                            </Button>
                          </form>
                          <form action={toggleJobAction}>
                            <input type="hidden" name="jobId" value={job.id} />
                            <input type="hidden" name="field" value="featured" />
                            <input type="hidden" name="value" value={(!job.featured).toString()} />
                            <Button size="xs" variant="outline">
                              {job.featured ? "Remove highlight" : "Pre-feature"}
                            </Button>
                          </form>
                        </div>
                      </div>
                    ))}
                    {pendingJobs.length === 0 && (
                      <p className="text-sm text-slate-500">No drafts or inactive postings.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Featured spotlight</p>
                  <Badge variant="outline" className="text-xs">{featuredJobs.length} live</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {featuredJobs.length === 0 && (
                    <p className="text-sm text-slate-500">No featured jobs yet.</p>
                  )}
                  {featuredJobs.map((job) => (
                    <div key={job.id} className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-800 shadow-sm">
                      <p className="font-semibold">{job.title}</p>
                      <p className="text-xs">{job.company}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">Create job posting</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" action={createJobAction}>
                <div>
                  <label className="text-sm font-medium text-slate-700">Title</label>
                  <Input name="title" placeholder="Product Manager" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Company</label>
                  <Input name="company" placeholder="Acme Corp" required />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Location</label>
                    <Input name="location" placeholder="San Francisco, CA" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Country</label>
                    <Input name="country" placeholder="USA" required />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Job type</label>
                    <select
                      name="jobType"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      defaultValue="FULL_TIME"
                    >
                      {JobTypeValues.map((option) => (
                        <option key={option} value={option}>
                          {option.toLowerCase().replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Remote option</label>
                    <select
                      name="remoteOption"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      defaultValue="ONSITE"
                    >
                      {RemoteOptionValues.map((option) => (
                        <option key={option} value={option}>
                          {option.toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Description</label>
                  <Textarea name="description" placeholder="Summary, requirements, perks..." rows={4} />
                </div>
                <Button type="submit" className="w-full">
                  Post job
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-slate-200/70 bg-white/95">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Recent submissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {snapshot.recentJobs.length === 0 && (
              <p className="text-sm text-slate-500">No recent jobs in the pipeline.</p>
            )}
            {snapshot.recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{job.title}</p>
                  <p className="text-xs text-slate-500">{job.company}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <Badge variant={job.isActive ? "secondary" : "outline"} className="capitalize">
                    {job.isActive ? "live" : "draft"}
                  </Badge>
                  <span>{job.jobType.toLowerCase().replace("_", " ")}</span>
                  <span>
                    {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(job.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </AdminShell>
    </div>
  );
}
