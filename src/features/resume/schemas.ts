import { ResumeVisibility } from "@prisma/client";
import { z } from "zod";

const monthInput = z
  .string()
  .regex(/^[0-9]{4}-(0[1-9]|1[0-2])$/, "Use the YYYY-MM format");

export const ResumeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  summary: z.string().optional(),
  personaName: z.string().optional(),
  location: z.string().optional(),
  targetIndustry: z.string().optional(),
  targetRoles: z.array(z.string()).optional(),
  yearsExperience: z.number().int().nonnegative().optional(),
  topSkills: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  notableAchievements: z.string().optional(),
  visibility: z.nativeEnum(ResumeVisibility).optional(),
});

export const ResumeExperienceSchema = z.object({
  company: z.string().min(1, "Company is required"),
  role: z.string().min(1, "Role is required"),
  startDate: monthInput,
  endDate: monthInput.optional(),
  rawDescription: z.string().max(2000).optional(),
});

export const ResumeProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  summary: z.string().max(1000).optional(),
  link: z.string().url("Provide a valid link").optional(),
  techStack: z.array(z.string()).optional(),
});

export type ResumeInput = z.infer<typeof ResumeSchema>;
export type ResumeExperienceInput = z.infer<typeof ResumeExperienceSchema>;
export type ResumeProjectInput = z.infer<typeof ResumeProjectSchema>;
