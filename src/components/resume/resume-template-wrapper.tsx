"use client";

import type {
  ResumeExperience,
  ResumeProject,
  ResumeVisibility,
} from "@prisma/client";

import { ResumeModernTemplate } from "@/components/resume/resume-modern-template";
import { ResumeClassicTemplate } from "@/components/resume/resume-classic-template";
import { ResumeMinimalTemplate } from "@/components/resume/resume-minimal-template";

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
  switch (template) {
    case "classic":
      return <ResumeClassicTemplate resume={resume} />;
    case "minimal":
      return <ResumeMinimalTemplate resume={resume} />;
    case "modern":
    default:
      return <ResumeModernTemplate resume={resume} />;
  }
}
