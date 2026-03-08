import type { ATSAnalysisResponse, SkillAnalysisResponse } from "@/lib/ai/resume";

export type SummaryActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  optimizedSummary?: string;
};

export type BulletActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  bulletPoints?: string[];
  experienceId?: string;
};

export type SkillActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  analysis?: SkillAnalysisResponse;
};

export type ATSActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  analysis?: ATSAnalysisResponse;
};

export type CoverLetterActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  coverLetter?: string;
};

export type ExperienceFieldErrors = Partial<
  Record<"company" | "role" | "startDate" | "endDate" | "rawDescription", string>
>;

export type ExperienceFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: ExperienceFieldErrors;
};

export type ProjectFieldErrors = Partial<Record<"name" | "summary" | "link" | "techStack", string>>;

export type ProjectFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: ProjectFieldErrors;
};

export const experienceFormInitial: ExperienceFormState = { status: "idle" };
export const projectFormInitial: ProjectFormState = { status: "idle" };
