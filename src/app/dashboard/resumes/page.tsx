import Link from "next/link";
import { Edit2, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CreateResumeButton } from "@/components/resume/create-resume-button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardResumesPage() {
  const session = await requireSession({
    allowedRoles: ["STUDENT"],
    failureMode: "error",
  });

  const resumes = await prisma.resume.findMany({
    where: { userId: session.sub },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            My Resumes
          </h1>
          <p className="mt-2 text-slate-600">
            Build, customize, and manage your professional resumes with AI assistance.
          </p>
        </div>
        <CreateResumeButton />
      </div>

      {/* Resumes List */}
      {resumes.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-blue-50 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Edit2 className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No resumes yet</h3>
          <p className="text-slate-600 mb-6">
            Create your first resume and start applying to opportunities
          </p>
          <CreateResumeButton />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => (
            <div
              key={resume.id}
              className="group relative rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 hover:-translate-y-1"
            >
              <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
                <div className="text-center">
                  <Edit2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">{resume.title || "Untitled Resume"}</p>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-slate-900 line-clamp-1">
                  {resume.title || "Untitled Resume"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Updated {new Date(resume.updatedAt).toLocaleDateString()}
                </p>

                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    asChild
                  >
                    <Link href={`/resume/${resume.slug}/edit`}>
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    asChild
                  >
                    <Link href={`/resume/${resume.slug}/preview`}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    asChild
                  >
                    <Link href={`/api/resumes/${resume.id}/export`}>
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Tools Section */}
      <section className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">AI Resume Tools</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/resume/builder?mode=optimize"
            className="p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 group"
          >
            <h3 className="font-medium text-slate-900 group-hover:text-blue-900 transition-colors">
              Optimize for ATS
            </h3>
            <p className="text-sm text-slate-600 group-hover:text-blue-700 mt-1 transition-colors">
              Improve your resume's compatibility with Applicant Tracking Systems
            </p>
          </Link>
          <Link
            href="/resume/builder?mode=skills"
            className="p-4 rounded-lg border border-slate-200 hover:border-green-300 hover:bg-green-50 transition-all duration-300 group"
          >
            <h3 className="font-medium text-slate-900 group-hover:text-green-900 transition-colors">
              Extract Skills
            </h3>
            <p className="text-sm text-slate-600 group-hover:text-green-700 mt-1 transition-colors">
              Automatically identify and highlight your professional skills
            </p>
          </Link>
          <Link
            href="/resume/builder?mode=bullets"
            className="p-4 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 group"
          >
            <h3 className="font-medium text-slate-900 group-hover:text-purple-900 transition-colors">
              Improve Bullets
            </h3>
            <p className="text-sm text-slate-600 group-hover:text-purple-700 mt-1 transition-colors">
              Get AI suggestions to enhance your achievement bullets
            </p>
          </Link>
          <Link
            href="/resume/builder?mode=summary"
            className="p-4 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-all duration-300 group"
          >
            <h3 className="font-medium text-slate-900 group-hover:text-amber-900 transition-colors">
              Professional Summary
            </h3>
            <p className="text-sm text-slate-600 group-hover:text-amber-700 mt-1 transition-colors">
              Create or improve your professional summary with AI
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
