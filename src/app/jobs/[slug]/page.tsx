import { notFound } from "next/navigation";
import { MapPin, Briefcase, Clock, DollarSign, Building, Users, Eye, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getJobBySlug, incrementJobViewCount } from "@/features/jobs/service";

type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
type RemoteOption = 'REMOTE' | 'HYBRID' | 'ONSITE';

export const dynamic = "force-dynamic";
export const revalidate = 0;

const jobTypeColors = {
  FULL_TIME: "bg-blue-100 text-blue-800",
  PART_TIME: "bg-green-100 text-green-800",
  CONTRACT: "bg-purple-100 text-purple-800",
  INTERNSHIP: "bg-yellow-100 text-yellow-800",
  FREELANCE: "bg-orange-100 text-orange-800",
};

const remoteOptionColors = {
  ONSITE: "bg-red-100 text-red-800",
  HYBRID: "bg-indigo-100 text-indigo-800",
  REMOTE: "bg-emerald-100 text-emerald-800",
};

async function incrementView(jobId: string) {
  await incrementJobViewCount(jobId);
}

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

  // Increment view count (fire and forget)
  incrementView(job.id);


  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/jobs" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Jobs
            </Link>
          </Button>
        </div>

        {/* Job Header */}
        <Card className="mb-8">
          <CardHeader className="pb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  {/* Featured badge would go here once field is added to schema */}
                </div>
                <CardTitle className="text-3xl mb-2">{job.title}</CardTitle>
                <CardDescription className="text-xl font-medium text-gray-700 mb-4">
                  {job.company}
                </CardDescription>
                
                {/* Job Details */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {job.location}, {job.country}
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    <Badge className={jobTypeColors[job.jobType as keyof typeof jobTypeColors]}>
                      {job.jobType.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <Badge className={remoteOptionColors[job.remoteOption as keyof typeof remoteOptionColors]}>
                      {job.remoteOption.replace("_", " ")}
                    </Badge>
                  </div>
                  {job.salaryRange && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      <span>{job.salaryRange}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-right text-sm text-gray-500 ml-6">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {job._count.applications} applications
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3" />
                  Posted {new Date(job.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Tags */}
            {job.tags.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {job.tags.map((tag: any) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {job.description && (
              <div>
                <h3 className="font-semibold mb-3">Job Description</h3>
                <div className="prose prose-slate max-w-none">
                  {job.description.split("\n").map((paragraph, i) => (
                    <p key={i} className="mb-4 text-gray-700 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            {job.requirements.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Requirements</h3>
                <ul className="space-y-2">
                  {job.requirements.map((requirement: any, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Apply Button */}
            <div className="pt-6 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Ready to apply?</h3>
                  <p className="text-gray-600">
                    Submit your application and join {job.company}
                  </p>
                </div>
                <Button size="lg" asChild>
                  <Link href={`/jobs/${job.slug}/apply`}>
                    Apply Now
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Similar Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Similar Opportunities</CardTitle>
            <CardDescription>
              Other jobs you might be interested in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                Similar jobs will be shown here based on your preferences.
              </p>
              <Button variant="outline" asChild>
                <Link href="/jobs">
                  Browse All Jobs
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
