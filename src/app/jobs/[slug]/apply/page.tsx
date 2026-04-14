import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function JobApplyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Simple placeholder - job application temporarily disabled
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href={`/jobs/${slug}`} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Job
            </Link>
          </Button>
        </div>

        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Job Application - Temporarily Disabled
          </h1>
          <p className="text-gray-600 mb-8">
            The job application feature is currently under maintenance. 
            Please check back later or contact the company directly.
          </p>
          <Button asChild>
            <Link href={`/jobs/${slug}`}>
              Return to Job Details
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
