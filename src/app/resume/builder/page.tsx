import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ResumeBuilderWizard } from "./resume-builder-wizard";
import { verifyToken } from "@/lib/auth/jwt";

export default async function ResumeBuilderPage() {
  const store = await cookies();
  const token = store.get("access_token")?.value;

  if (!token) {
    redirect("/login");
  }

  try {
    verifyToken(token);
  } catch {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <header className="text-center">
          <h1 className="text-3xl font-semibold text-slate-900">Resume Studio</h1>
          <p className="text-slate-600">Create an ATS-ready resume with AI assistance.</p>
        </header>

        <ResumeBuilderWizard />
      </div>
    </main>
  );
}
