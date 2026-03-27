import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { invalidateDashboardInsights } from "@/features/dashboard/service";

interface ImportResumeRequest {
  title: string;
  personaName?: string;
  location?: string;
  summary?: string;
  rawContent: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession({
      allowedRoles: ["STUDENT"],
      failureMode: "error",
    });

    const body = (await request.json()) as ImportResumeRequest;

    const { title, personaName, location, summary, rawContent } = body;

    if (!title || !rawContent) {
      return NextResponse.json(
        { error: "Title and resume content are required" },
        { status: 400 }
      );
    }

    // Generate unique slug
    let slug = slugify(title);
    let uniqueSlug = slug;
    let counter = 1;

    while (
      await prisma.resume.findUnique({
        where: { slug: uniqueSlug, userId: session.sub },
      })
    ) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    // Generate share slug
    const shareSlug = crypto.randomUUID().replace(/-/g, "").slice(0, 16);

    // Create resume
    const resume = await prisma.resume.create({
      data: {
        userId: session.sub,
        title,
        slug: uniqueSlug,
        shareSlug,
        personaName: personaName || "",
        location: location || "",
        summary: summary || "",
        visibility: "PRIVATE",
        template: "modern",
        skills: extractSkills(rawContent),
      },
    });

    await invalidateDashboardInsights(session.sub);

    return NextResponse.json({
      success: true,
      resume: {
        id: resume.id,
        slug: resume.slug,
        title: resume.title,
      },
    });
  } catch (error) {
    console.error("Resume import error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to import resume" },
      { status: 500 }
    );
  }
}

/**
 * Simple skill extraction from resume text
 * This is a basic implementation - can be enhanced with AI
 */
function extractSkills(text: string): string[] {
  const commonSkills = [
    "JavaScript",
    "TypeScript",
    "React",
    "Vue",
    "Angular",
    "Node.js",
    "Python",
    "Java",
    "C#",
    "PHP",
    "SQL",
    "MongoDB",
    "PostgreSQL",
    "AWS",
    "Azure",
    "GCP",
    "Docker",
    "Kubernetes",
    "Git",
    "REST API",
    "GraphQL",
    "HTML",
    "CSS",
    "Tailwind",
    "Bootstrap",
    "Leadership",
    "Communication",
    "Problem Solving",
    "Project Management",
    "Agile",
    "Scrum",
    "Excel",
    "Word",
    "PowerPoint",
  ];

  const textLower = text.toLowerCase();
  const foundSkills: Set<string> = new Set();

  commonSkills.forEach((skill) => {
    if (textLower.includes(skill.toLowerCase())) {
      foundSkills.add(skill);
    }
  });

  return Array.from(foundSkills);
}
