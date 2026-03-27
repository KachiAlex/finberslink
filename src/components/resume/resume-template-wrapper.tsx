"use client";

import type {
  ResumeExperience,
  ResumeProject,
  ResumeVisibility,
} from "@prisma/client";

import { ResumeModernTemplate } from "@/components/resume/resume-modern-template";
import { ResumeClassicTemplate } from "@/components/resume/resume-classic-template";
import { ResumeMinimalTemplate } from "@/components/resume/resume-minimal-template";
import { ResumeExecutiveTemplate } from "@/components/resume/resume-executive-template";

export interface ResumeTemplateWrapperProps {
  template?: string | null;
  resume: {
    title: string;
    summary: string | null;
    visibility: ResumeVisibility;
    skills?: string[];
    personaName?: string | null;
    location?: string | null;
    introVideoEmbedUrl?: string | null;
    experiences: Array<
      Pick<
        ResumeExperience,
        "id" | "company" | "role" | "startDate" | "endDate" | "description" | "achievements"
      >
    >;
    projects: Array<
      Pick<ResumeProject, "id" | "name" | "summary" | "link" | "techStack">
    >;
  };
}

export function ResumeTemplateWrapper({
  template = "modern",
  resume,
}: ResumeTemplateWrapperProps) {
  const renderedTemplate = (() => {
    switch (template) {
      case "classic":
        return <ResumeClassicTemplate resume={resume} />;
      case "minimal":
        return <ResumeMinimalTemplate resume={resume} />;
      case "executive":
        return <ResumeExecutiveTemplate resume={resume} />;
      case "modern":
      default:
        return <ResumeModernTemplate resume={resume} />;
    }
  })();

  const handleDownloadPdf = () => {
    window.print();
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 print:hidden">
        <button
          type="button"
          onClick={handleDownloadPdf}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-slate-700"
        >
          Download PDF
        </button>
      </div>
      {renderedTemplate}
    </>
  );
}
