import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getResumeBySlug } from "@/features/resume/service";
import { ResumePublicView } from "@/components/resume/resume-public-view";
import { Button } from "@/components/ui/button";
import { getSessionFromCookies } from "@/lib/auth/session";

export default async function ResumePreviewPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const session = await getSessionFromCookies();

  const resume = await getResumeBySlug(slug);

  // Allow access if it's the owner's resume, regardless of visibility
  if (!resume || !session || resume.userId !== session.sub) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 bg-slate-800 border-b border-slate-700 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 lg:px-8">
          <Button
            asChild
            variant="ghost"
            className="text-slate-300 hover:text-white hover:bg-slate-700"
          >
            <Link href={`/resume/${slug}/edit`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Preview content */}
      <ResumePublicView resume={resume} />
    </div>
  );
}
