import { requireSession } from "@/lib/auth/session";
import { InterviewPrepDashboard } from "@/features/interview/components/interview-dashboard";

export const metadata = {
  title: "AI Interview Studio | Finbers Link",
  description: "Run mock interviews with AI-guided audio practice and tailored feedback.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InterviewStudioPage() {
  await requireSession({
    allowedRoles: ["STUDENT"],
    failureMode: "redirect",
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <InterviewPrepDashboard />
      </div>
    </main>
  );
}
