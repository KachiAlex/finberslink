import { revalidatePath } from "next/cache";

type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
type RemoteOption = 'REMOTE' | 'HYBRID' | 'ONSITE';

const JobTypeValues = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'] as const;
const RemoteOptionValues = ['REMOTE', 'HYBRID', 'ONSITE'] as const;

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createJobPosting,
  listAdminJobs,
  requireAdminUser,
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

export default async function AdminJobsPage() {
  const [admin, jobs] = await Promise.all([requireAdminUser(), listAdminJobs()]);

  return (
    <div className="space-y-8">
      <AdminShell
        title="Jobs"
        description="Post and manage employer opportunities with type and remote preferences."
        actions={<Badge variant="secondary">{admin.role.replace("_", " ")} access</Badge>}
      >
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">Active postings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-slate-500">
                      <th className="pb-3">Title</th>
                      <th className="pb-3">Company</th>
                      <th className="pb-3">Location</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Remote</th>
                      <th className="pb-3">Posted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {jobs.map((job) => (
                      <tr key={job.id} className="text-slate-700">
                        <td className="py-3 font-semibold">{job.title}</td>
                        <td>{job.company}</td>
                        <td>{job.location}</td>
                        <td className="capitalize">{job.jobType.toLowerCase().replace("_", " ")}</td>
                        <td className="capitalize">{job.remoteOption.toLowerCase()}</td>
                        <td>
                          {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(job.createdAt)}
                        </td>
                      </tr>
                    ))}
                    {jobs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                          No job postings yet. Use the form to add the first opportunity.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
                <Button type="submit" className="w-full">
                  Post job
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </AdminShell>
    </div>
  );
}
