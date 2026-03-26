import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getResumeBySlug, updateResume } from "@/features/resume/service";
import { ResumeTemplateWrapper } from "@/components/resume/resume-template-wrapper";
import { ResumeTemplateSelector } from "@/components/resume/resume-template-selector";
import { Button } from "@/components/ui/button";
import { getSessionFromCookies } from "@/lib/auth/session";

async function updateResumeTemplate(slug: string, templateId: string) {
  "use server";
  await updateResume(slug, { template: templateId });
}

export default async function ResumePreviewPage({ params }: any) {
  const { slug } = params as { slug: string };
  const session = await getSessionFromCookies();

  const resume = await getResumeBySlug(slug);

  // Allow access if it's the owner's resume, regardless of visibility
  if (!resume || !session || resume.userId !== session.sub) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header with back button and template selector */}
      <div className="sticky top-0 z-20 bg-slate-800 border-b border-slate-700 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 mb-4">
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

          {/* Template Selector */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <ResumeTemplateSelector
              currentTemplate={resume.template}
              onSelect={async (templateId: string) => {
                "use server";
                await updateResumeTemplate(slug, templateId);
              }}
            />
          </div>
        </div>
      </div>

      {/* Preview content */}
      <ResumeTemplateWrapper template={resume.template} resume={resume} />
    </div>
  );
}
