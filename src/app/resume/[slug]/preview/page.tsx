import { notFound } from "next/navigation";

import { ResumeTemplateWrapper } from "../../../../components/resume/resume-template-wrapper";
import { getResumeBySlug } from "@/features/resume/service";
import { requireSession } from "../../../../lib/auth/session";

export default async function ResumePreviewPage({ params }: any) {
  const { slug } = params as { slug: string };

  const session = await requireSession({ failureMode: "redirect" });
  const resume = await getResumeBySlug(slug);

  if (!resume || resume.userId !== session.sub) {
    notFound();
  }

  return (
    <ResumeTemplateWrapper
      template={resume.template}
      resume={resume}
      showDownloadAction
    />
  );
}

