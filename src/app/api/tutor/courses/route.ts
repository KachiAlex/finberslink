import { NextRequest, NextResponse } from "next/server";
import { CourseLevel, LessonFormat } from "@prisma/client";
import { z } from "zod";

import { verifyToken } from "@/lib/auth/jwt";
import { createTutorCourseWithAssessments } from "@/features/tutor/service";

const LessonModuleSchema = z.object({
  title: z.string().min(1),
  format: z.nativeEnum(LessonFormat),
  durationMinutes: z.number().int().min(0),
  summary: z.string().optional(),
  content: z.string().optional(),
  videoUrl: z.string().url().optional(),
});

const ExamModuleSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["MCQ", "SHORT_ANSWER", "UPLOAD"]),
  prompt: z.string().min(1),
  choices: z.array(z.string()).optional(),
  answer: z.string().optional(),
  resources: z.array(z.string()).optional(),
});

const ExamConfigSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
  timeLimit: z.number().int().min(5).max(240).optional(),
  modules: z.array(ExamModuleSchema).min(1),
});

const SectionSchema = z.object({
  title: z.string().min(1),
  order: z.number().int().min(1),
  modules: z.array(LessonModuleSchema).min(1),
  exam: ExamConfigSchema.optional(),
});

const BodySchema = z.object({
  coverImage: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  tagline: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  level: z.nativeEnum(CourseLevel),
  outcomes: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  sections: z.array(SectionSchema).min(1),
  finalExam: ExamConfigSchema.optional(),
});

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(accessToken);
    if (user.role !== "TUTOR") {
      return NextResponse.json({ error: "Tutor access required" }, { status: 403 });
    }

    const json = await request.json();
    const parsed = BodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.format() }, { status: 400 });
    }

    const body = parsed.data;

    const course = await createTutorCourseWithAssessments({
      tutorId: user.sub,
      coverImage: body.coverImage,
      title: body.title,
      slug: body.slug,
      tagline: body.tagline,
      description: body.description,
      category: body.category,
      level: body.level,
      outcomes: body.outcomes,
      skills: body.skills,
      sections: body.sections.map((section) => ({
        ...section,
        exam: section.exam ? { ...section.exam, modules: section.exam.modules } : undefined,
      })),
      finalExam: body.finalExam ? { ...body.finalExam, modules: body.finalExam.modules } : undefined,
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error: any) {
    console.error("Tutor course creation error:", error);
    return NextResponse.json({ error: error.message ?? "Failed to create course" }, { status: 500 });
  }
}
