import { z } from "zod";

export const ResumeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  summary: z.string().optional(),
});

export type ResumeInput = z.infer<typeof ResumeSchema>;
