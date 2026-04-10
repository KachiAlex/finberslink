import Link from "next/link";
import { Plus, Download, Edit2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResumeCard } from "@/components/resume/resume-card";
import { CreateResumeButton } from "@/components/resume/create-resume-button";
import { ExportButton } from "@/components/resume/export-button";
import { getSessionFromCookies } from "../../lib/auth/session";
import { prisma } from "../../lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ResumesPage() {
  const session = await getSessionFromCookies();
  
  // Redirect authenticated students to dashboard resumes
  if (session && session.role === "STUDENT") {
    redirect("/dashboard/resumes");
  }

  if (!session) redirect("/login");

  const resumes = await prisma.resume.findMany({
    where: { userId: session.sub },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <>
      <header className="rounded-4xl relative overflow-hidden border border-slate-200 bg-gradient-to-br from-green-50 to-slate-50 p-8 shadow-lg shadow-slate-200/70">
        <div className="absolute -right-16 top-6 h-48 w-48 rounded-full bg-gradient-to-br from-green-500/10 to-emerald-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-slate-500">Career Tools</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900 sm:text-5xl">
              My Resumes
            </h1>
            <p className="mt-3 max-w-2xl text-base text-slate-600">
              Build, customize, and manage your professional resumes with AI assistance.
            </p>
          </div>
          <Button asChild size="lg" className="w-fit">
            <Link href="/resume/builder">
              <Plus className="mr-2 h-4 w-4" />
              Create Resume
            </Link>
          </Button>
        </div>
      </header>

      <section>
        {resumes.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Edit2 className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No resumes yet</h3>
            <p className="text-slate-600 mb-6">
              Create your first resume and start applying to opportunities
            </p>
            <Button asChild>
              <Link href="/resume/builder">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Resume
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resumes.map((resume: any) => (
              <ResumeCard key={resume.id} resume={resume} />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">AI Resume Tools</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/resumes/builder?mode=optimize" className="p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all">
            <h3 className="font-medium text-slate-900">Optimize for ATS</h3>
            <p className="text-sm text-slate-600 mt-1">Improve your resume&apos;s compatibility with Applicant Tracking Systems</p>
          </Link>
          <Link href="/resumes/builder?mode=skills" className="p-4 rounded-lg border border-slate-200 hover:border-green-300 hover:bg-green-50 transition-all">
            <h3 className="font-medium text-slate-900">Extract Skills</h3>
            <p className="text-sm text-slate-600 mt-1">Automatically identify and highlight your professional skills</p>
          </Link>
          <Link href="/resumes/builder?mode=bullets" className="p-4 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-all">
            <h3 className="font-medium text-slate-900">Improve Bullets</h3>
            <p className="text-sm text-slate-600 mt-1">Get AI suggestions to enhance your achievement bullets</p>
          </Link>
          <Link href="/resumes/builder?mode=summary" className="p-4 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-all">
            <h3 className="font-medium text-slate-900">Professional Summary</h3>
            <p className="text-sm text-slate-600 mt-1">Create or improve your professional summary with AI</p>
          </Link>
        </div>
      </section>
    </>
  );
}
