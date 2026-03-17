import { notFound } from "next/navigation";

import { getResumeByShareSlug } from "@/features/resume/service";
import { ResumePublicView } from "@/components/resume/resume-public-view";

export default async function ResumeSharePage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const resume = await getResumeByShareSlug(slug);
  if (!resume || resume.visibility !== "PUBLIC") {
    notFound();
  }

  return <ResumePublicView resume={resume} />;
}
