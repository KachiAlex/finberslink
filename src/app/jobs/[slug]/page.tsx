import { notFound } from "next/navigation";
import { MapPin, Briefcase, Clock, DollarSign, Building, Users, Eye, Calendar, ArrowLeft, CheckCircle2, Share2, MessageCircle } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getJobBySlug, isJobSaved } from "@/features/jobs/service";
import { getSessionFromCookies } from "@/lib/auth/session";
import { JobViewTracker } from "./_components/job-view-tracker";
import { SaveJobButton } from "../_components/save-job-button";

type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
type RemoteOption = 'REMOTE' | 'HYBRID' | 'ONSITE';

export const dynamic = "force-dynamic";
export const revalidate = 0;

const jobTypeColors = {
  FULL_TIME: "bg-cyan-900/30 text-cyan-300 border-cyan-700/50",
  PART_TIME: "bg-emerald-900/30 text-emerald-300 border-emerald-700/50",
  CONTRACT: "bg-violet-900/30 text-violet-300 border-violet-700/50",
  INTERNSHIP: "bg-amber-900/30 text-amber-300 border-amber-700/50",
  FREELANCE: "bg-rose-900/30 text-rose-300 border-rose-700/50",
};

const remoteOptionColors = {
  ONSITE: "bg-slate-900/30 text-slate-300 border-slate-700/50",
  HYBRID: "bg-indigo-900/30 text-indigo-300 border-indigo-700/50",
  REMOTE: "bg-emerald-900/30 text-emerald-300 border-emerald-700/50",
};

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);

  if (!job || !job.isActive) {
    notFound();
  }

  const session = await getSessionFromCookies();
  const saved = session ? await isJobSaved(session.sub, job.id) : false;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <JobViewTracker jobId={job.id} />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Navigation */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="text-slate-400 hover:text-white hover:bg-slate-800/50">
            <Link href="/jobs" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to opportunities
            </Link>
          </Button>
        </div>

        {/* Job Hero Section */}
        <div className="mb-8 rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 via-slate-800/50 to-slate-900/80 p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">{job.title}</h1>
                <p className="text-xl text-cyan-300 font-semibold mb-4">{job.company}</p>
                <p className="text-slate-400">{job.salaryRange || "Salary negotiable"}</p>
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Location</p>
                  <div className="flex items-center gap-2 text-white">
                    <MapPin className="h-5 w-5 text-slate-500" />
                    <span>{job.location}, {job.country}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Posted</p>
                  <div className="flex items-center gap-2 text-white">
                    <Calendar className="h-5 w-5 text-slate-500" />
                    <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {job.tags.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-3">Required Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {job.tags.slice(0, 6).map((tag: any) => (
                      <Badge key={tag} className="bg-slate-700/50 text-slate-200 border border-slate-600/50">
                        {tag}
                      </Badge>
                    ))}
                    {job.tags.length > 6 && (
                      <Badge className="bg-slate-700/50 text-slate-200 border border-slate-600/50">
                        +{job.tags.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Application Stats Card */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-6 space-y-6 h-fit">
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-cyan-300">{(job as any)._count?.applications || 0}</p>
                  <p className="text-sm text-slate-400 mt-1">Applications submitted</p>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white uppercase tracking-[0.3em]">Job Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge className={`border ${jobTypeColors[job.jobType as keyof typeof jobTypeColors]}`}>
                      {job.jobType.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`border ${remoteOptionColors[job.remoteOption as keyof typeof remoteOptionColors]}`}>
                      {job.remoteOption.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>

              <div className="flex flex-col gap-3">
                <Button size="lg" asChild className="w-full bg-cyan-600 hover:bg-cyan-700">
                  <Link href={`/jobs/${(job as any).slug}/apply`}>
                    Apply Now
                  </Link>
                </Button>
                <div className="flex gap-2">
                  <SaveJobButton jobId={job.id} initialSaved={saved} />
                  <Button size="lg" variant="outline" asChild className="flex-1 border-slate-700 hover:border-slate-600 text-slate-300">
                    <Link href="/chat" className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Ask
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {job.description && (
              <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-8">
                <h2 className="text-2xl font-bold text-white mb-6">About the Role</h2>
                <div className="space-y-4">
                  {job.description.split("\n").map((paragraph: any, i: number) => (
                    <p key={i} className="text-slate-300 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            {job.requirements.length > 0 && (
              <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Key Requirements</h2>
                <div className="space-y-3">
                  {job.requirements.map((requirement: any, index: number) => (
                    <div key={index} className="flex items-start gap-4 p-3 rounded-lg bg-slate-900/30 border border-slate-700/20">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">{requirement}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Company Info */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Company Info</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-slate-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-400">Hiring Company</p>
                    <p className="text-white font-semibold">{job.company}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-slate-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-400">Applicants</p>
                    <p className="text-white font-semibold">{(job as any)._count?.applications || 0} applied</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Share Section */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Share This Role</h3>
              <p className="text-sm text-slate-400 mb-4">Know someone perfect for this job?</p>
              <Button variant="outline" size="sm" className="w-full border-slate-700 hover:border-slate-600 text-slate-300">
                <Share2 className="h-4 w-4 mr-2" />
                Share Link
              </Button>
            </div>

            {/* Next Steps */}
            <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-cyan-600/10 via-slate-800/30 to-slate-900/30 p-6 border-cyan-600/20">
              <h3 className="text-lg font-bold text-white mb-4">Ready to Apply?</h3>
              <ol className="space-y-3 text-sm text-slate-300">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-cyan-600/20 border border-cyan-600/30 text-cyan-300 text-xs font-semibold">1</span>
                  <span>Review the job description</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-cyan-600/20 border border-cyan-600/30 text-cyan-300 text-xs font-semibold">2</span>
                  <span>Prepare your resume</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-cyan-600/20 border border-cyan-600/30 text-cyan-300 text-xs font-semibold">3</span>
                  <span>Click "Apply Now"</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-cyan-600/20 border border-cyan-600/30 text-cyan-300 text-xs font-semibold">4</span>
                  <span>Track your application</span>
                </li>
              </ol>
              <Button className="w-full mt-6 bg-cyan-600 hover:bg-cyan-700" asChild>
                <Link href={`/jobs/${(job as any).slug}/apply`}>
                  Start Application
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
