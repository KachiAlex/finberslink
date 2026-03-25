import { notFound } from "next/navigation";

import { getResumeBySlug } from "@/features/resume/service";
import { ResumeTemplateWrapper } from "@/components/resume/resume-template-wrapper";

export default async function ResumePublicPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const resume = await getResumeBySlug(slug);
  if (!resume || resume.visibility !== "PUBLIC") {
    notFound();
  }

  return <ResumeTemplateWrapper template={resume.template} resume={resume} />;
}
