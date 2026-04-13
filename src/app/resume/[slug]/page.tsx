import { notFound } from "next/navigation";

import { ResumeTemplateWrapper } from "@/components/resume/resume-template-wrapper";
import { getResumeBySlug } from "@/features/resume/service";
import { getSessionFromCookies } from "@/lib/auth/session";

export default async function ResumePublicPage({ params }: any) {
  const { slug } = params as { slug: string };
  const resume = await getResumeBySlug(slug);

  if (!resume) {
    notFound();
  }

  const session = await getSessionFromCookies();
  const isOwner = session?.sub === resume.userId;

  if (!isOwner && resume.visibility !== "PUBLIC") {
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
