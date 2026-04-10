import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { invalidateDashboardInsights } from "../../../../features/dashboard/service";
import { createResumeExperience, createResumeEducation } from "../../../../features/resume/service";
import { upsertStudentProfile } from "../../../../features/profile/service";

if (process.env.NODE_ENV === "production") {
  // Prevent accidental exposure in production
  // Next will still compile the file but we bail at runtime
}

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
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as ImportResumeRequest;
    const { title, personaName, location, summary, rawContent } = body;

    if (!title || !rawContent) {
      return NextResponse.json({ error: "Title and resume content are required" }, { status: 400 });
    }

    const userId = process.env.DEV_TEST_USER || "user_student_demo";

    // Generate unique slug
    let slug = slugify(title);
    let uniqueSlug = slug;
    let counter = 1;

    while (
      await prisma.resume.findUnique({
        where: { slug: uniqueSlug, userId },
      })
    ) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    const shareSlug = crypto.randomUUID().replace(/-/g, "").slice(0, 16);

    const resume = await prisma.resume.create({
      data: {
        userId,
        title,
        slug: uniqueSlug,
        shareSlug,
        personaName: personaName || "",
        location: location || "",
        summary: summary || "",
        visibility: "PRIVATE",
        template: "modern",
        skills: [],
      },
    });

    await invalidateDashboardInsights(userId);

    // simple section splitting
    function splitIntoSections(text: string) {
      const lines = (text || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const sections: Record<string, string> = {};
      let current: string | null = null;
      let buffer: string[] = [];

      const headerMap: Array<[RegExp, string]> = [
        [/^professional experience|^experience|^work experience/i, "experience"],
        [/^education|^academic background/i, "education"],
        [/^certifications|^licenses|^certificates/i, "certifications"],
      ];

      function flush() {
        if (current && buffer.length) {
          sections[current] = (sections[current] || "") + buffer.join("\n\n") + "\n\n";
        }
        buffer = [];
      }

      for (const line of lines) {
        let matched = false;
        for (const [rx, name] of headerMap) {
          if (rx.test(line)) {
            flush();
            current = name;
            matched = true;
            break;
          }
        }
        if (!matched) {
          if (!current) buffer.push(line);
          else buffer.push(line);
        }
      }

      flush();
      return sections;
    }

    function extractExperiences(sectionText: string) {
      const blocks = sectionText.split(/\n\n+/).map(b => b.trim()).filter(Boolean);
      const results: Array<any> = [];
      for (const block of blocks) {
        const lines = block.split(/\n/).map(l => l.trim()).filter(Boolean);
        if (!lines.length) continue;
        const header = lines[0];
        let company = "";
        let role = "";
        const atMatch = header.match(/(.+) at (.+)/i);
        const dashMatch = header.match(/(.+)\s+[–—-]\s+(.+)/);
        if (atMatch) {
          role = atMatch[1].trim();
          company = atMatch[2].trim();
        } else if (dashMatch) {
          company = dashMatch[1].trim();
          role = dashMatch[2].trim();
        } else {
          company = header;
        }
        const description = lines.slice(1).join("\n");
        const yearMatch = block.match(/(19|20)\d{2}/g) || [];
        const start = yearMatch[0] ? `${yearMatch[0]}-01-01` : undefined;
        const end = yearMatch[1] ? `${yearMatch[1]}-12-31` : undefined;
        results.push({ company, role, description, startDate: start, endDate: end });
      }
      return results;
    }

    function extractEducation(sectionText: string) {
      const blocks = sectionText.split(/\n\n+/).map(b => b.trim()).filter(Boolean);
      const out: Array<any> = [];
      for (const block of blocks) {
        const lines = block.split(/\n/).map(l => l.trim()).filter(Boolean);
        if (!lines.length) continue;
        const school = lines[0];
        const degreeLine = lines[1] || "";
        const degreeMatch = degreeLine.match(/(Bachelor|Master|B\.|M\.|PhD|Doctor)/i);
        const degree = degreeMatch ? degreeLine : null;
        out.push({ school, degree, description: lines.slice(2).join(" ") || null });
      }
      return out;
    }

    function extractCertifications(sectionText: string) {
      return sectionText.split(/\n/).map(l => l.trim()).filter(Boolean).slice(0,20);
    }

    try {
      const sections = splitIntoSections(rawContent || "");

      if (sections.experience) {
        const experiences = extractExperiences(sections.experience);
        for (const exp of experiences) {
          try {
            const start = exp.startDate ? new Date(String(exp.startDate)) : new Date();
            const end = exp.endDate ? new Date(String(exp.endDate)) : null;
            await createResumeExperience({
              resumeId: resume.id,
              company: exp.company || exp.companyName || "",
              role: exp.role || exp.title || "",
              startDate: start,
              endDate: end,
              description: exp.description || null,
              achievements: Array.isArray(exp.achievements) ? exp.achievements : [],
            });
          } catch (err) {
            console.warn("Failed to persist imported experience", err);
          }
        }
      }

      if (sections.education) {
        const educations = extractEducation(sections.education);
        for (const edu of educations) {
          try {
            await createResumeEducation({
              resumeId: resume.id,
              school: edu.school || edu.institution || "",
              degree: edu.degree || null,
              field: edu.field || null,
              summary: edu.description || null,
            });
          } catch (err) {
            console.warn("Failed to persist imported education", err);
          }
        }
      }

      if (sections.certifications) {
        const certs = extractCertifications(sections.certifications);
        if (certs.length) {
          try {
            await upsertStudentProfile({ userId, certifications: certs });
          } catch (err) {
            console.warn("Failed to persist imported certifications", err);
          }
        }
      }
    } catch (err) {
      console.warn("Import parsing heuristics failed:", err);
    }

    return NextResponse.json({ success: true, resume: { id: resume.id, slug: resume.slug, title: resume.title } });
  } catch (error) {
    console.error("Resume import-test error:", error);
    return NextResponse.json({ error: (error as Error).message || "Failed to import resume" }, { status: 500 });
  }
}
