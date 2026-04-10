import { notFound } from "next/navigation";

import { getResumeByShareSlug, incrementResumeViewCount } from "@/features/resume/service";
import { ResumeTemplateWrapper } from "../../../../components/resume/resume-template-wrapper";

export default async function ResumeSharePage({ params }: any) {
  const { slug } = params as { slug: string };
  const resume = await getResumeByShareSlug(slug);
  if (!resume || resume.visibility !== "PUBLIC") {
    notFound();
  }

  if (resume.id) {
    await incrementResumeViewCount(resume.id);
  }

  return (
    <ResumeTemplateWrapper
      template={resume.template}
      resume={resume}
      showDownloadAction
    />
  );
}
