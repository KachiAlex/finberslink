import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { Prisma } from "@prisma/client";
import type { ResumeVisibility } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  createResumeExperience,
  createResumeProject,
  getResumeBySlug,
  regenerateResumeShareSlug,
  updateResume,
  updateResumeExperience,
  updateResumeSkillSnapshot,
} from "@/features/resume/service";
import { ResumeExperienceSchema, ResumeProjectSchema } from "@/features/resume/schemas";
import {
  analyzeATSMatch,
  analyzeSkills,
  generateBulletPoints,
  generateCoverLetter,
  optimizeResumeSummary,
} from "@/lib/ai/resume";
import { verifyToken } from "@/lib/auth/jwt";
import { invalidateDashboardInsights } from "@/features/dashboard/service";
import type {
  ATSActionState,
  BulletActionState,
  CoverLetterActionState,
  SummaryActionState,
  SkillActionState,
} from "./ai-types";
import {
  SummaryAIForm,
  ExperienceBulletsAIForm,
  SkillAnalysisForm,
  ATSAnalysisForm,
  CoverLetterAIForm,
} from "./ai-forms";
import { ShareLinkCopy } from "./share-link";
import { NewExperienceForm, NewProjectForm } from "./forms";
import { ResumeTemplateWrapper } from "@/components/resume/resume-template-wrapper";
import { ResumeTemplateSelector } from "@/components/resume/resume-template-selector";

// Add Experience Action
async function addExperienceAction(formData: FormData) {
  "use server";

  const slug = String(formData.get("slug") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  const endDate = String(formData.get("endDate") ?? "").trim();
  const rawDescription = String(formData.get("rawDescription") ?? "").trim();
  const generatedAchievementsRaw = String(formData.get("generatedAchievements") ?? "").trim();

  let generatedAchievements: string[] = [];
  if (generatedAchievementsRaw) {
    try {
      const parsedAchievements = JSON.parse(generatedAchievementsRaw);
      if (Array.isArray(parsedAchievements)) {
        generatedAchievements = parsedAchievements
          .filter((entry) => typeof entry === "string" && entry.trim().length > 0)
          .map((entry) => entry.trim());
      }
    } catch (parseError) {
      console.warn("Failed to parse generated achievements", parseError);
    }
  }

  const parsed = ResumeExperienceSchema.safeParse({
    company,
    role,
    startDate,
    endDate: endDate || undefined,
    rawDescription: rawDescription || undefined,
  });

  if (!parsed.success) {
    // For simplicity, we just log errors; UI can be enhanced later.
    console.error("Experience validation failed", parsed.error.format());
    return;
  }

  if (!slug) return;

  const user = await requireUser();
  const resume = await getResumeBySlug(slug);
  if (!resume || resume.userId !== user.sub) {
    notFound();
  }

  await createResumeExperience({
    resumeId: resume.id,
    company: parsed.data.company,
    role: parsed.data.role,
    startDate: new Date(parsed.data.startDate),
    endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
    description: parsed.data.rawDescription ?? null,
    achievements: generatedAchievements,
  });

  await invalidateDashboardInsights(user.sub);

  revalidatePath(`/resume/${slug}/edit`);
}

// Add Project Action
async function addProjectAction(formData: FormData) {
  "use server";

  const slug = String(formData.get("slug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const link = String(formData.get("link") ?? "").trim();
  const techStackRaw = String(formData.get("techStack") ?? "").trim();
  const techStack = techStackRaw ? techStackRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const parsed = ResumeProjectSchema.safeParse({
    name,
    summary: summary || undefined,
    link: link || undefined,
    techStack,
  });

  if (!parsed.success) {
    console.error("Project validation failed", parsed.error.format());
    return;
  }

  if (!slug) return;

  const user = await requireUser();
  const resume = await getResumeBySlug(slug);
  if (!resume || resume.userId !== user.sub) {
    notFound();
  }

  await createResumeProject({
    resumeId: resume.id,
    name: parsed.data.name,
    summary: parsed.data.summary ?? null,
    link: parsed.data.link ?? null,
    techStack: parsed.data.techStack ?? [],
  });

  await invalidateDashboardInsights(user.sub);

  revalidatePath(`/resume/${slug}/edit`);
}

// Local placeholder removed — using imported `NewProjectForm` from ./forms

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { Prisma } from "@prisma/client";

import type { ResumeVisibility } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AIButton } from "@/components/ai/ai-button";
import { BulletSuggestions } from "@/components/ai/bullet-suggestions";
import { SkillAnalysis } from "@/components/ai/skill-analysis";
import {
  createResumeExperience,
  createResumeProject,
  getResumeBySlug,
  regenerateResumeShareSlug,
  updateResume,
  updateResumeExperience,
  updateResumeSkillSnapshot,
} from "@/features/resume/service";
import { ResumeExperienceSchema, ResumeProjectSchema } from "@/features/resume/schemas";
import {
  analyzeATSMatch,
  analyzeSkills,
  generateBulletPoints,
  generateCoverLetter,
  optimizeResumeSummary,
} from "@/lib/ai/resume";
import { verifyToken } from "@/lib/auth/jwt";
import { invalidateDashboardInsights } from "@/features/dashboard/service";
import type {
  ATSActionState,
  BulletActionState,
  CoverLetterActionState,
  ExperienceFormState,
  ProjectFormState,
  SkillActionState,
  SummaryActionState,
} from "./ai-types";
import {
  SummaryAIForm,
  ExperienceBulletsAIForm,
  SkillAnalysisForm,
  ATSAnalysisForm,
  CoverLetterAIForm,
} from "./ai-forms";
import { ShareLinkCopy } from "./share-link";
import { NewExperienceForm, NewProjectForm } from "./forms";

async function requireUser() {
  const store = await cookies();
  const token = store.get("access_token")?.value;
  if (!token) {
    redirect("/login");
  }

  try {
    return verifyToken(token);
  } catch {
    redirect("/login");
  }
}

async function atsAnalysisAction(
  _prevState: ATSActionState,
  formData: FormData
): Promise<ATSActionState> {
  "use server";

  const slug = String(formData.get("slug") ?? "").trim();
  const jobDescription = String(formData.get("jobDescription") ?? "").trim();

  if (!slug || !jobDescription) {
    return { status: "error", message: "Provide a job description to analyze." };
  }

  const user = await requireUser();
  const resume = await getResumeBySlug(slug);
  if (!resume || resume.userId !== user.sub) {
    notFound();
  }

  const resumeContent = [
    resume.summary,
    (resume.experiences as any)
      .map(
        (exp: any) =>
          `${exp.role} at ${exp.company} (${experienceDurationLabel(exp)})\n${exp.achievements.join(
            "\n"
          )}`
      )
      .join("\n"),
    (resume.projects as any)
      .map((project: any) => `${project.name}: ${project.summary}`)
      .join("\n"),
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const { analysis, usedFallback } = await analyzeATSMatch({
      resumeContent,
      jobDescription,
    });
    return {
      status: "success",
      analysis,
      usedFallback,
      message: usedFallback
        ? "Quota hit—showing heuristic ATS insights. Verify keywords manually."
        : "ATS analysis completed.",
    };
  } catch (error) {
    console.error("Error running ATS analysis:", error);
    return { status: "error", message: "Failed to run ATS analysis" };
  }
}

async function coverLetterAction(
  _prevState: CoverLetterActionState,
  formData: FormData
): Promise<CoverLetterActionState> {
  "use server";

  const slug = String(formData.get("slug") ?? "").trim();
  const jobDescription = String(formData.get("jobDescription") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();

  if (!slug || !jobDescription || !company) {
    return { status: "error", message: "Provide company and job description." };
  }

  const user = await requireUser();
  const resume = await getResumeBySlug(slug);
  if (!resume || resume.userId !== user.sub) {
    notFound();
  }

  const resumeContent = [
    resume.summary,
    resume.personaName,
    resume.location,
    (resume.experiences as any)
      .map(
        (exp: any) =>
          `${exp.role} at ${exp.company} (${experienceDurationLabel(exp)})\n${exp.achievements.join(
            "\n"
          )}`
      )
      .join("\n"),
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const { coverLetter, usedFallback } = await generateCoverLetter(resumeContent, jobDescription, company);
    return {
      status: "success",
      coverLetter,
      usedFallback,
      message: usedFallback
        ? "Quota hit—using local template. Personalize before sending."
        : "Cover letter drafted.",
    };
  } catch (error) {
    console.error("Error generating cover letter:", error);
    return { status: "error", message: "Failed to generate cover letter" };
  }
}

function experienceDurationLabel(experience: {
  startDate: Date | string;
  endDate?: Date | string | null;
}) {
  const start = new Date(experience.startDate).toLocaleDateString();
  const end = experience.endDate ? new Date(experience.endDate).toLocaleDateString() : "Present";
  return `${start} - ${end}`;
}

function collectExperienceHighlights(
  experiences: Array<{ achievements: string[]; description: string | null }>
) {
  return experiences.flatMap((exp) =>
    (exp.achievements?.length ? exp.achievements : exp.description ? [exp.description] : []).filter(
      Boolean
    )
  );
}

async function updateResumeAction(formData: FormData) {
  "use server";

  const slug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const introVideoUrl = String(formData.get("introVideoUrl") ?? "").trim();

  if (!slug || !title) {
    return;
  }

  const user = await requireUser();
  const resume = await getResumeBySlug(slug);
  if (!resume || resume.userId !== user.sub) {
    notFound();
  }

  await updateResume(slug, {
    title,
    summary,
    introVideoUrl: introVideoUrl || null,
  });

  await invalidateDashboardInsights(user.sub);

  revalidatePath(`/resume/${slug}/edit`);
}

async function regenerateShareSlugAction(formData: FormData) {
  "use server";

  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) return;

  const user = await requireUser();
  const resume = await getResumeBySlug(slug);
  if (!resume || resume.userId !== user.sub) {
    notFound();
  }

  await regenerateResumeShareSlug(slug);
  revalidatePath(`/resume/${slug}/edit`);
}

async function updateVisibilityAction(formData: FormData) {
  "use server";

  const slug = String(formData.get("slug") ?? "").trim();
  const visibility = String(formData.get("visibility") ?? "").trim() as ResumeVisibility;

  if (!slug || !visibility) {
    return;
  }

  const allowed: ResumeVisibility[] = ["PRIVATE", "NETWORK", "PUBLIC"];
  if (!allowed.includes(visibility)) {
    return;
  }

  const user = await requireUser();
  const resume = await getResumeBySlug(slug);
  if (!resume || resume.userId !== user.sub) {
    notFound();
  }

  await updateResume(slug, { visibility });
  await invalidateDashboardInsights(user.sub);
  revalidatePath(`/resume/${slug}/edit`);
}

async function optimizeSummaryAction(
  _prevState: SummaryActionState,
  formData: FormData
): Promise<SummaryActionState> {
  "use server";

  const slug = String(formData.get("slug") ?? "").trim();
  const currentSummary = String(formData.get("summary") ?? "").trim();

  if (!slug) {
    return { status: "error", message: "Missing resume reference" };
  }

  const user = await requireUser();
  const resume = await getResumeBySlug(slug);
  if (!resume || resume.userId !== user.sub) {
    notFound();
  }

  try {
    const optimizedSummary = await optimizeResumeSummary({
      currentSummary: currentSummary || resume.summary || undefined,
      experience: collectExperienceHighlights(resume.experiences as any),
      skills: resume.skills ?? [],
      targetRole: resume.targetRoles?.[0] ?? resume.targetIndustry ?? undefined,
    });

    await updateResume(slug, { summary: optimizedSummary.summary });
    revalidatePath(`/resume/${slug}/edit`);
    return {
      status: "success",
      optimizedSummary: optimizedSummary.summary,
      message: "Summary updated with AI rewrite.",
    };
  } catch (error) {
    console.error("Error optimizing summary:", error);
    return { status: "error", message: "Failed to optimize summary" };
  }
}

export async function generateBulletsAction(
  _prevState: BulletActionState,
  formData: FormData
): Promise<BulletActionState> {
  "use server";

  const slug = String(formData.get("slug") ?? "").trim();
  const experienceId = String(formData.get("experienceId") ?? "").trim();

  if (!slug || !experienceId) {
    return { status: "error", message: "Missing experience reference" };
  }

  const user = await requireUser();
  const resume = await getResumeBySlug(slug);
  if (!resume || resume.userId !== user.sub) {
    notFound();
  }

  const experience = (resume.experiences as any).find(
    (item: { id: string }) => item.id === experienceId
  );
  if (!experience) {
    return { status: "error", message: "Experience not found" };
  }

  try {
    const { bulletPoints, usedFallback } = await generateBulletPoints({
      company: experience.company,
      role: experience.role,
      duration: experienceDurationLabel(experience),
      rawDescription: experience.description ?? "",
      targetRole: resume.targetRoles?.[0] ?? resume.targetIndustry ?? undefined,
    });

    return {
      status: "success",
      bulletPoints,
      experienceId,
      usedFallback,
      message: usedFallback
        ? "Quota hit—showing locally generated bullets. Review before applying."
        : "AI drafted new bullet points.",
    };
  } catch (error) {
    console.error("Error generating bullets:", error);
    return { status: "error", message: "Failed to generate bullet points" };
  }
}

export async function analyzeSkillsAction(
  _prevState: SkillActionState,
  formData: FormData
): Promise<SkillActionState> {
  "use server";

  const slug = String(formData.get("slug") ?? "").trim();
  const experienceInput = String(formData.get("experience") ?? "").trim();
  const targetRole = String(formData.get("targetRole") ?? "").trim();
  const jobDescription = String(formData.get("jobDescription") ?? "").trim();

  if (!slug) {
    return { status: "error", message: "Missing resume reference" };
  }

  const user = await requireUser();
  const resume = await getResumeBySlug(slug);
  if (!resume || resume.userId !== user.sub) {
    notFound();
  }

  const experienceLines = experienceInput
    ? experienceInput.split("\n").map((line) => line.trim()).filter(Boolean)
    : collectExperienceHighlights(resume.experiences as any);

  if (experienceLines.length === 0) {
    return { status: "error", message: "Provide experience text to analyze." };
  }

  try {
    const { analysis, usedFallback } = await analyzeSkills({
      experience: experienceLines,
      targetRole: targetRole || resume.targetRoles?.[0] || undefined,
      jobDescription: jobDescription || undefined,
    });

    await updateResumeSkillSnapshot(resume.id, analysis);
    await invalidateDashboardInsights(user.sub);

    return {
      status: "success",
      analysis,
      usedFallback,
      message: usedFallback
        ? "Quota hit—showing offline skill suggestions. Review before applying."
        : "Skill analysis ready.",
    };
  } catch (error) {
    console.error("Error analyzing skills:", error);
    return { status: "error", message: "Failed to analyze skills" };
  }
}

async function requestPdfExportAction(formData: FormData) {
  "use server";

  const slug = String(formData.get("slug") ?? "").trim();

  if (!slug) {
    return;
  }

  const user = await requireUser();
  const resume = await getResumeBySlug(slug);
  if (!resume || resume.userId !== user.sub) {
    notFound();
  }

  // TODO: Integrate PDF export pipeline.
  console.info("PDF export requested for resume slug:", slug);
}

async function applyGeneratedBulletsAction(input: {
  slug: string;
  experienceId: string;
  bullets: string[];
}) {
  "use server";

  if (!input.slug || !input.experienceId || input.bullets.length === 0) {
    return;
  }

  const user = await requireUser();
  const resume = await getResumeBySlug(input.slug);
  if (!resume || resume.userId !== user.sub) {
    notFound();
  }

  await updateResumeExperience(input.experienceId, { achievements: input.bullets });
  const skillAnalysis = await analyzeSkills({
    experience: collectExperienceHighlights(resume.experiences as any),
    targetRole: resume.targetRoles?.[0] || undefined,
  });

  await updateResumeSkillSnapshot(resume.id, skillAnalysis as unknown as Prisma.InputJsonValue);
  await invalidateDashboardInsights(user.sub);
  revalidatePath(`/resume/${input.slug}/edit`);
}

async function applySkillSelectionAction(input: {
  slug: string;
  hard: string[];
  soft: string[];
  suggested: string[];
}) {
  "use server";

  if (!input.slug) {
    return;
  }

  const user = await requireUser();
  const resume = await getResumeBySlug(input.slug);
  if (!resume || resume.userId !== user.sub) {
    notFound();
  }

  const mergedSkills = Array.from(
    new Set([...(resume.skills ?? []), ...input.hard, ...input.soft, ...input.suggested])
  );

  await updateResume(input.slug, {
    skills: mergedSkills,
    topSkills: input.hard.slice(0, 6),
  });
  await invalidateDashboardInsights(user.sub);
  revalidatePath(`/resume/${input.slug}/edit`);
}

export default async function ResumeEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resume = await getResumeBySlug(slug);
  if (!resume) {
    notFound();
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const sharePath = (resume as any).shareSlug
    ? `/resume/share/${(resume as any).shareSlug}`
    : `/resume/${(resume as any).slug}`;
  const shareUrl = `${baseUrl}${sharePath}`;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900">Resume Studio</h1>
          <p className="text-slate-600">Build and preview your resume in real-time</p>
        </header>

        {/* Main Grid Layout */}
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          {/* Left Panel: Forms */}
          <div className="space-y-6">
            {/* Basic Info Card */}
            <Card className="border border-slate-200/70 bg-white/95">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Resume Title</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" action={updateResumeAction}>
                  <input type="hidden" name="slug" value={(resume as any).slug} />
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" name="title" defaultValue={(resume as any).title} required />
                  </div>
                  <Button type="submit">Save</Button>
                </form>
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card className="border border-slate-200/70 bg-white/95">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Professional Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" action={updateResumeAction}>
                  <input type="hidden" name="slug" value={(resume as any).slug} />
                  <Textarea 
                    name="summary" 
                    defaultValue={(resume as any).summary ?? ""} 
                    rows={4}
                    placeholder="Write a brief summary of your professional background..."
                  />
                  <div className="flex gap-2">
                    <Button type="submit" variant="outline">Save</Button>
                    <SummaryAIForm
                      slug={(resume as any).slug}
                      currentSummary={(resume as any).summary ?? ""}
                      action={optimizeSummaryAction}
                    />
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Intro Video Card */}
            <Card className="border border-slate-200/70 bg-white/95">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Intro Video (optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" action={updateResumeAction}>
                  <input type="hidden" name="slug" value={(resume as any).slug} />
                  <div className="space-y-2">
                    <Label htmlFor="introVideoUrl">Video URL</Label>
                    <Input
                      id="introVideoUrl"
                      name="introVideoUrl"
                      placeholder="https://youtu.be/..."
                      defaultValue={(resume as any).introVideoUrl ?? ""}
                    />
                    <p className="text-xs text-slate-500">
                      Supports YouTube, Vimeo, Google Drive, and Cloudinary links.
                    </p>
                  </div>
                  {(resume as any).introVideoEmbedUrl ? (
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wide text-slate-500">
                        Preview
                      </Label>
                      <div className="aspect-video overflow-hidden rounded-xl border border-slate-200">
                        <iframe
                          title="Intro video preview"
                          src={(resume as any).introVideoEmbedUrl}
                          className="h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  ) : null}
                  <Button type="submit">Save</Button>
                </form>
              </CardContent>
            </Card>

            {/* Experience Section */}
            <Card className="border border-slate-200/70 bg-white/95">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Experience</CardTitle>
                <CardDescription>Add your work experience</CardDescription>
              </CardHeader>
              <CardContent>
                {(resume as any).experiences.length > 0 ? (
                  <div className="space-y-4 mb-6">
                    {(resume as any).experiences.map((experience: any) => (
                      <div key={experience.id} className="border rounded-lg p-4 bg-slate-50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{experience.role}</h4>
                            <p className="text-sm text-slate-600">{experience.company}</p>
                            <p className="text-xs text-slate-500">
                              {new Date(experience.startDate).toLocaleDateString()} - {experience.endDate ? new Date(experience.endDate).toLocaleDateString() : "Present"}
                            </p>
                          </div>
                        </div>
                        <ul className="text-sm text-slate-700 space-y-1">
                          {experience.achievements.map((achievement: any, idx: number) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              {achievement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 mb-4 text-sm">No experience added yet.</p>
                )}
                <div className="space-y-4 border-t pt-4">
                  <NewExperienceForm
                    slug={(resume as any).slug}
                    action={addExperienceAction}
                    industryHint={(resume as any).targetIndustry ?? null}
                    defaultRole={(resume as any).targetRoles?.[0] ?? null}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Skills Section */}
            <Card className="border border-slate-200/70 bg-white/95">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Skills</CardTitle>
                <CardDescription>Your technical and soft skills</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(resume as any).skills.map((skill: any) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
                <div className="border-t pt-4">
                  <SkillAnalysisForm
                    slug={(resume as any).slug}
                    action={analyzeSkillsAction}
                    onApply={applySkillSelectionAction}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Projects Section */}
            <Card className="border border-slate-200/70 bg-white/95">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Projects</CardTitle>
              </CardHeader>
              <CardContent>
                {(resume as any).projects.length > 0 ? (
                  <div className="space-y-4 mb-6">
                    {(resume as any).projects.map((project: any) => (
                      <div key={project.id} className="border rounded-lg p-4 bg-slate-50">
                        <h4 className="font-semibold mb-2">{project.name}</h4>
                        <p className="text-sm text-slate-600 mb-2">{project.summary}</p>
                        {project.techStack.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {project.techStack.map((tech: any) => (
                              <Badge key={tech} variant="outline" className="text-xs">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 mb-4 text-sm">No projects added yet.</p>
                )}
                <div className="border-t pt-4">
                  <NewProjectForm slug={(resume as any).slug} action={addProjectAction} />
                </div>
              </CardContent>
            </Card>

            {/* Job Targeting Section */}
            <Card className="border border-slate-200/70 bg-white/95">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Job Matching</CardTitle>
                <CardDescription>ATS check & cover letter generation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <section className="space-y-3">
                  <p className="text-sm font-semibold text-slate-900">ATS Alignment Check</p>
                  <ATSAnalysisForm slug={(resume as any).slug} action={atsAnalysisAction} />
                </section>
                <section className="space-y-3 border-t pt-4">
                  <p className="text-sm font-semibold text-slate-900">Generate Cover Letter</p>
                  <CoverLetterAIForm slug={(resume as any).slug} action={coverLetterAction} />
                </section>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Live Preview */}
          <div className="sticky top-8 h-[calc(100vh-100px)] overflow-y-auto bg-slate-900 rounded-lg shadow-xl border border-slate-800 hidden lg:block">
            <div className="h-full overflow-auto">
              <ResumeTemplateWrapper
                template={(resume as any).template || "modern"}
                resume={resume as any}
              />
            </div>
          </div>
        </div>

        {/* Publish & Share Footer */}
        <Card className="border border-indigo-200 bg-white/95 mt-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Publish & Share</CardTitle>
            <CardDescription>Control visibility and share your resume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Visibility Options */}
              <form action={updateVisibilityAction} className="space-y-4">
                <input type="hidden" name="slug" value={(resume as any).slug} />
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Visibility</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["PRIVATE", "NETWORK", "PUBLIC"] as ResumeVisibility[]).map((visibilityOption) => (
                      <label
                        key={visibilityOption}
                        className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide ${
                          (resume as any).visibility === visibilityOption
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-slate-200 hover:border-indigo-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="visibility"
                          value={visibilityOption}
                          defaultChecked={(resume as any).visibility === visibilityOption}
                          className="sr-only"
                        />
                        {visibilityOption.toLowerCase()}
                      </label>
                    ))}
                  </div>
                </div>
                <Button type="submit" variant="outline" size="sm">
                  Update Visibility
                </Button>
              </form>

              {/* Share Link */}
              <div className="space-y-2 border-t pt-4">
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Shareable Link
                </Label>
                <ShareLinkCopy href={shareUrl} />
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>ID: {(resume as any).shareSlug ?? "pending"}</span>
                  <form action={regenerateShareSlugAction} className="inline">
                    <input type="hidden" name="slug" value={(resume as any).slug} />
                    <Button type="submit" variant="ghost" size="sm" className="px-2 text-xs" >
                      Refresh
                    </Button>
                  </form>
                </div>
              </div>

              {/* Template Selector */}
              <div className="border-t pt-4">
                <Label className="text-sm font-semibold mb-3 block">Template</Label>
                <ResumeTemplateSelector
                  currentTemplate={(resume as any).template}
                  onSelect={async (templateId: string) => {
                    "use server";
                    await updateResume((resume as any).slug, { template: templateId });
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 border-t pt-4">
                <Button asChild variant="secondary" className="w-full">
                  <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                    Open Public View
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
