import Link from "next/link";
import { Edit2, Eye } from "lucide-react";
import fs from "fs";
import path from "path";

import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "../../../lib/prisma";
import { CreateResumeButton } from "@/components/resume/create-resume-button";
import { ExportButton } from "@/components/resume/export-button";
import { ImportResumeModal } from "@/components/resume/import-resume-modal";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardResumesPage() {
  const logPath = path.resolve(process.cwd(), "tmp", "resumes-error.log");

  function devLog(msg: string) {
    if (process.env.NODE_ENV !== "production") {
      try {
        fs.mkdirSync(path.dirname(logPath), { recursive: true });
        fs.appendFileSync(logPath, `${new Date().toISOString()}\t${msg}\n`);
      } catch {
        // ignore file logging errors
      }
    }
  }

  try {
    devLog("START resumes page render");

    const session = await requireSession({
      allowedRoles: ["STUDENT"],
      failureMode: "redirect",
    });

    devLog(`SESSION ok sub=${session.sub}`);

    let resumes: Awaited<ReturnType<typeof prisma.resume.findMany>> = [];
    try {
      resumes = await prisma.resume.findMany({
        where: { userId: session.sub },
        orderBy: { updatedAt: "desc" },
      });
      devLog(`DB ok count=${resumes.length}`);
    } catch (dbErr) {
      const msg = dbErr instanceof Error ? dbErr.stack ?? dbErr.message : String(dbErr);
      devLog(`DB ERROR: ${msg}`);
      console.error("[resumes/page] prisma.resume.findMany failed:", msg);
      // continue with empty array – surface error in UI below
    }

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
          <div className="flex gap-2">
            <ImportResumeModal />
            <CreateResumeButton />
          </div>
        </div>

        {/* Resumes list */}
        {resumes.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-blue-50 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Edit2 className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">No resumes yet</h3>
            <p className="mb-6 text-slate-600">
              Create your first resume and start applying to opportunities
            </p>
            <CreateResumeButton />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Header Section */}
                <div className="flex h-32 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50 p-6">
                  <div className="text-center">
                    <Edit2 className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600 truncate max-w-full">
                      {resume.title || "Untitled Resume"}
                    </p>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6">
                  <h3 className="line-clamp-2 text-lg font-semibold text-slate-900 min-h-[2.5rem]">
                    {resume.title || "Untitled Resume"}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Updated {new Date(resume.updatedAt).toLocaleDateString()}
                  </p>

                  {/* Action Buttons - Always visible */}
                  <div className="mt-6 space-y-3">
                    {/* Primary Actions Row */}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" asChild>
                        <Link href={`/resume/${resume.slug}/edit`}>
                          <Edit2 className="mr-1 h-4 w-4" />
                          Edit
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" asChild>
                        <Link href={`/resume/${resume.slug}/preview`} target="_blank" rel="noopener noreferrer">
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                    </div>
                    
                    {/* Export Button - Full width */}
                    <ExportButton 
                      resumeId={resume.id} 
                      resumeTitle={resume.title || "Untitled Resume"}
                      variant="default"
                      size="default"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Tools */}
        <section className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8">
          <h2 className="mb-6 text-xl font-semibold text-slate-900">AI Resume Tools</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                href: "/resume/builder?mode=optimize",
                title: "Optimize for ATS",
                desc: "Improve your resume's compatibility with Applicant Tracking Systems",
                hover: "hover:border-blue-300 hover:bg-blue-50",
                titleHover: "group-hover:text-blue-900",
                descHover: "group-hover:text-blue-700",
              },
              {
                href: "/resume/builder?mode=skills",
                title: "Extract Skills",
                desc: "Automatically identify and highlight your professional skills",
                hover: "hover:border-green-300 hover:bg-green-50",
                titleHover: "group-hover:text-green-900",
                descHover: "group-hover:text-green-700",
              },
              {
                href: "/resume/builder?mode=bullets",
                title: "Improve Bullets",
                desc: "Get AI suggestions to enhance your achievement bullets",
                hover: "hover:border-purple-300 hover:bg-purple-50",
                titleHover: "group-hover:text-purple-900",
                descHover: "group-hover:text-purple-700",
              },
              {
                href: "/resume/builder?mode=summary",
                title: "Professional Summary",
                desc: "Create or improve your professional summary with AI",
                hover: "hover:border-amber-300 hover:bg-amber-50",
                titleHover: "group-hover:text-amber-900",
                descHover: "group-hover:text-amber-700",
              },
            ].map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className={`group rounded-lg border border-slate-200 p-4 transition-all duration-300 ${tool.hover}`}
              >
                <h3 className={`font-medium text-slate-900 transition-colors ${tool.titleHover}`}>
                  {tool.title}
                </h3>
                <p className={`mt-1 text-sm text-slate-600 transition-colors ${tool.descHover}`}>
                  {tool.desc}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    );
  } catch (err) {
    const msg = err instanceof Error ? err.stack ?? err.message : String(err);
    devLog(`CATCH outer: ${msg}`);
    console.error("[resumes/page] unhandled error:", msg);
    return (
      <div className="space-y-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <h1 className="text-2xl font-semibold text-red-900">Resumes temporarily unavailable</h1>
          <p className="mt-2 text-red-700">
            We encountered an error loading your resumes. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }
}

