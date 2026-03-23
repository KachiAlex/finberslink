import { notFound } from "next/navigation";

import { getResumeByShareSlug, incrementResumeViewCount } from "@/features/resume/service";
import { ResumePublicView } from "@/components/resume/resume-public-view";

export default async function ResumeSharePage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const resume = await getResumeByShareSlug(slug);
  if (!resume || resume.visibility !== "PUBLIC") {
    notFound();
  }

  if (resume.id) {
    await incrementResumeViewCount(resume.id);
  }

  return <ResumePublicView resume={resume} />;
}
