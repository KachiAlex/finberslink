import { requireSession } from "@/lib/auth/session";
import { InterviewSessionView } from "@/features/interview/components/interview-session-view";

interface InterviewSessionPageProps {
  params: Promise<{ sessionId: string }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InterviewSessionPage({ params }: InterviewSessionPageProps) {
  await requireSession({
    allowedRoles: ["STUDENT"],
    failureMode: "redirect",
  });

  const { sessionId } = await params;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <InterviewSessionView sessionId={sessionId} />
      </div>
    </main>
  );
}
