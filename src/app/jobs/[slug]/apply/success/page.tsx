import { notFound } from "next/navigation";
import { CheckCircle, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getJobBySlug } from "@/features/jobs/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ApplicationSuccessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);

  if (!job) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Application Submitted!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Your application for <span className="font-semibold">{job.title}</span> at{" "}
            <span className="font-semibold">{job.company}</span> has been successfully submitted.
          </p>

          {/* Next Steps Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>What happens next?</CardTitle>
              <CardDescription>
                Here's what you can expect after submitting your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-blue-600">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Application Review</h4>
                    <p className="text-sm text-gray-600">
                      The hiring team will review your application and resume.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-blue-600">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Initial Screening</h4>
                    <p className="text-sm text-gray-600">
                      If your profile matches their requirements, you'll hear back about next steps.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-blue-600">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Interview Process</h4>
                    <p className="text-sm text-gray-600">
                      Selected candidates will be contacted for interviews.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" asChild>
              <Link href="/jobs" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Browse More Jobs
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/applications" className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Track Applications
              </Link>
            </Button>
          </div>

          {/* Additional Info */}
          <div className="mt-12 p-6 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Pro Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Check your email regularly for updates from {job.company}</li>
              <li>• Keep your resume updated with your latest experience</li>
              <li>• Prepare for potential interviews by researching the company</li>
              <li>• Follow up politely if you don't hear back within 2 weeks</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
