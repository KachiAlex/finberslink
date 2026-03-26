import { redirect, notFound } from "next/navigation";
import { getResumeBySlug } from "@/features/resume/service";

export default async function ResumePublicPage({ params }: any) {
  const { slug } = params as { slug: string };
  const resume = await getResumeBySlug(slug);
  
  if (!resume) {
    notFound();
  }

  // Redirect all resume view requests to the share link
  if (resume.shareSlug) {
    redirect(`/resume/share/${resume.shareSlug}`);
  }

  notFound();
}
