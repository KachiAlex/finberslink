import { NewsStatus } from "@prisma/client";
import { z } from "zod";

export const CreateNewsSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const UpdateNewsSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  content: z.string().min(1, "Content is required").optional(),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.nativeEnum(NewsStatus).optional(),
});

export type CreateNewsInput = z.infer<typeof CreateNewsSchema>;
export type UpdateNewsInput = z.infer<typeof UpdateNewsSchema>;
