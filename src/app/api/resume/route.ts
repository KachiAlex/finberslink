import { NextRequest, NextResponse } from "next/server";

import { createResume, listUserResumes, createResumeExperience, createResumeEducation } from "@/features/resume/service";
import { verifyToken } from "@/lib/auth/jwt";
import { ResumeCreateSchema } from "@/features/resume/schemas";
import { upsertStudentProfile } from "@/features/profile/service";

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = verifyToken(accessToken);
    const resumes = await listUserResumes(user.sub);

    return NextResponse.json({ resumes });
  } catch (error) {
    console.error("Resumes fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch resumes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = verifyToken(accessToken);
      const body = await request.json();
    const parsed = ResumeCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const resume = await createResume({
      userId: user.sub,
      ...(parsed.data as any),
    });

    // If experiences were provided in the creation payload, persist them as ResumeExperience
    try {
      const experiences = Array.isArray((body as any).experiences) ? (body as any).experiences : [];
      for (const exp of experiences) {
        try {
          const start = exp.startDate ? new Date(String(exp.startDate)) : new Date();
          const end = exp.endDate ? new Date(String(exp.endDate)) : null;
          await createResumeExperience({
            resumeId: resume.id,
            company: String(exp.company || exp.companyName || "").trim() || "",
            role: String(exp.role || exp.title || "").trim() || "",
            startDate: start,
            endDate: end,
            description: exp.description ? String(exp.description) : null,
            achievements: Array.isArray(exp.achievements) ? exp.achievements : [],
          });
        } catch (err) {
          console.warn("Failed to create resume experience", err);
        }
      }
      // persist education onto resume
      const educations = Array.isArray((body as any).education) ? (body as any).education : [];
      for (const edu of educations) {
        try {
          await createResumeEducation({
            resumeId: resume.id,
            school: String(edu.school || edu.institution || "").trim() || "",
            degree: edu.degree ? String(edu.degree) : null,
            field: edu.field ? String(edu.field) : null,
            summary: edu.description ? String(edu.description) : null,
          });
        } catch (err) {
          console.warn("Failed to create resume education", err);
        }
      }
    } catch (err) {
      console.warn("No experiences to persist", err);
    }

    // If certifications or education provided, persist them to the user's profile
    try {
      const certs = Array.isArray((body as any).certifications) ? (body as any).certifications : undefined;
      const education = (body as any).education !== undefined ? (body as any).education : undefined;
      if ((certs && certs.length) || education !== undefined) {
        await upsertStudentProfile({
          userId: user.sub,
          certifications: certs,
          education: education,
        });
      }
    } catch (err) {
      console.warn("Failed to persist profile qualifications", err);
    }
    return NextResponse.json(
      { message: "Resume created successfully", resume },
      { status: 201 }
    );
  } catch (error) {
    console.error("Resume creation error:", error);
    return NextResponse.json(
      { error: "Failed to create resume" },
      { status: 500 }
    );
  }
}
