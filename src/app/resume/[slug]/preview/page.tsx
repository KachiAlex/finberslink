import { redirect } from "next/navigation";

export default async function ResumePreviewPage({ params }: any) {
  const { slug } = params as { slug: string };
  // Redirect to the main edit page which now has live preview built-in
  redirect(`/resume/${slug}/edit`);
}

