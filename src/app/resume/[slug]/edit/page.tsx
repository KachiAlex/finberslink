// Add Experience Action
async function addExperienceAction(formData: FormData) {
  "use server";

  const slug = String(formData.get("slug") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  const endDate = String(formData.get("endDate") ?? "").trim();
  const rawDescription = String(formData.get("rawDescription") ?? "").trim();

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
    achievements: [],
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

// Replace placeholder NewProjectForm with actual form component
function NewProjectForm({ slug }: { slug: string }) {
  return (
    <form className="space-y-4" action={addProjectAction}>
      <input type="hidden" name="slug" value={slug} />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Project Name</Label>
          <Input id="name" name="name" placeholder="Project name" />
        </div>
        <div>
          <Label htmlFor="link">Link (optional)</Label>
          <Input id="link" name="link" placeholder="https://..." />
        </div>
      </div>
      <div>
        <Label htmlFor="summary">Summary (optional)</Label>
        <Textarea id="summary" name="summary" placeholder="Brief project description" rows={3} />
      </div>
      <div>
        <Label htmlFor="techStack">Tech Stack (comma separated)</Label>
        <Input id="techStack" name="techStack" placeholder="React, Node, PostgreSQL" />
      </div>
      <Button type="submit">Add Project</Button>
    </form>
  );
}

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

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
    const analysis = await analyzeATSMatch({
      resumeContent,
      jobDescription,
    });
    return { status: "success", analysis, message: "ATS analysis completed." };
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
    const coverLetter = await generateCoverLetter(resumeContent, jobDescription, company);
    return {
      status: "success",
      coverLetter,
      message: "Cover letter drafted.",
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
  });

  await invalidateDashboardInsights(user.sub);

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

    await updateResume(slug, { summary: optimizedSummary });
    revalidatePath(`/resume/${slug}/edit`);
    return {
      status: "success",
      optimizedSummary,
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
    const bulletPoints = await generateBulletPoints({
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
      message: "AI drafted new bullet points.",
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
    const analysis = await analyzeSkills({
      experience: experienceLines,
      targetRole: targetRole || resume.targetRoles?.[0] || undefined,
      jobDescription: jobDescription || undefined,
    });

    await updateResumeSkillSnapshot(resume.id, analysis);
    await invalidateDashboardInsights(user.sub);

    return { status: "success", analysis, message: "Skill analysis ready." };
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
  await updateResumeSkillSnapshot(resume.id, await analyzeSkills({
    experience: collectExperienceHighlights(resume.experiences as any),
    targetRole: resume.targetRoles?.[0] || undefined,
  }));
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
  const shareUrl = `${baseUrl}/resume/${(resume as any).slug}`;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <header>
          <h1 className="text-3xl font-semibold text-slate-900">Edit Resume</h1>
          <p className="text-slate-600">Update your resume details and sections.</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Basic Info</CardTitle>
              <CardDescription>Title and summary</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" action={updateResumeAction}>
                <input type="hidden" name="slug" value={(resume as any).slug} />
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" defaultValue={(resume as any).title} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="summary">Summary</Label>
                  <Textarea id="summary" name="summary" defaultValue={(resume as any).summary ?? ""} rows={4} />
                </div>
                <Button type="submit">Save changes</Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Actions */}
<Card className="border border-slate-200/70 bg-white/95">
  <CardHeader>
    <CardTitle className="text-lg font-semibold text-slate-900">Quick Actions</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Add Experience button removed; form is below */}
    <NewProjectForm slug={(resume as any).slug} />
    <SummaryAIForm
      slug={(resume as any).slug}
      currentSummary={(resume as any).summary ?? ""}
      action={optimizeSummaryAction}
    />
    <Button variant="outline" className="w-full">
      Preview Public View
    </Button>
  </CardContent>
</Card>

          <Card className="border border-indigo-200 bg-white/95">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Publish & Share</CardTitle>
              <CardDescription>Control visibility and share your public link.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form action={updateVisibilityAction} className="space-y-4">
                <input type="hidden" name="slug" value={(resume as any).slug} />
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
                        onChange={() => {}}
                      />
                      {visibilityOption.toLowerCase()}
                    </label>
                  ))}
                </div>
                <Button type="submit" variant="outline" size="sm" className="w-full">
                  Update visibility
                </Button>
              </form>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Shareable link
                </p>
                <ShareLinkCopy href={shareUrl} />
                {(resume as any).visibility !== "PUBLIC" && (
                  <p className="text-xs text-amber-600">
                    Set visibility to <strong>Public</strong> before sending the link.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <a href={shareUrl} target="_blank" rel="noreferrer noopener">
                    Preview public page
                  </a>
                </Button>
                <form action={requestPdfExportAction}>
                  <input type="hidden" name="slug" value={(resume as any).slug} />
                  <Button type="submit" variant="outline" className="w-full" disabled>
                    Export PDF (coming soon)
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-slate-200/70 bg-white/95">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Experience</CardTitle>
            <CardDescription>Add your work experience with AI assistance.</CardDescription>
          </CardHeader>
          <CardContent>
            {(resume as any).experiences.length > 0 ? (
              <div className="space-y-4">
                {(resume as any).experiences.map((experience: any) => (
                  <div key={experience.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{experience.role}</h4>
                        <p className="text-sm text-slate-600">{experience.company}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(experience.startDate).toLocaleDateString()} - {experience.endDate ? new Date(experience.endDate).toLocaleDateString() : "Present"}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                    <ul className="text-sm text-slate-700 space-y-1">
                      {experience.achievements.map((achievement: any, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {achievement}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 pt-3 border-t">
                      <ExperienceBulletsAIForm
                        slug={(resume as any).slug}
                        experienceId={experience.id}
                        action={generateBulletsAction}
                        onApply={applyGeneratedBulletsAction}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500 mb-4">No work experience added yet.</p>
                <Button>Add Experience</Button>
              </div>
            )}
            
            {/* Add Experience Form */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-semibold mb-4">Add New Experience</h4>
              <form className="space-y-4" action={addExperienceAction}>
                <input type="hidden" name="slug" value={(resume as any).slug} />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" name="company" placeholder="Company name" />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" name="role" placeholder="Job title" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input id="startDate" name="startDate" type="month" />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input id="endDate" name="endDate" type="month" placeholder="Present" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="rawDescription">Job Description (optional)</Label>
                  <Textarea
                    id="rawDescription"
                    name="rawDescription"
                    placeholder="Describe your responsibilities and achievements..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Add Experience</Button>
                  <AIButton
                    variant="outline"
                    onClick={() => {
                      // TODO: Generate bullets from form data
                      console.log('Generate bullets from form');
                    }}
                  >
                    AI Generate Bullets First
                  </AIButton>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/70 bg-white/95">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Skills</CardTitle>
            <CardDescription>Manage your technical and soft skills with AI assistance.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {(resume as any).skills.map((skill: any) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h4 className="font-semibold">AI Skill Analysis</h4>
              <SkillAnalysisForm
                slug={(resume as any).slug}
                action={analyzeSkillsAction}
                onApply={applySkillSelectionAction}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/70 bg-white/95">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Projects</CardTitle>
            <CardDescription>Featured projects</CardDescription>
          </CardHeader>
          <CardContent>
            {(resume as any).projects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 mb-4">No projects added yet.</p>
                <Button>Add Project</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {(resume as any).projects.map((project: any) => (
                  <div key={project.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{project.name}</h4>
                        <p className="text-sm text-slate-600">{project.summary}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
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
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200/70 bg-white/95">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Targeted Applications</CardTitle>
            <CardDescription>Run ATS checks and draft tailored cover letters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <section className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">ATS Alignment</p>
                <p className="text-xs text-slate-500">
                  Paste a job description and we’ll highlight gaps, keywords, and recommendations.
                </p>
              </div>
              <ATSAnalysisForm slug={(resume as any).slug} action={atsAnalysisAction} />
            </section>

            <section className="space-y-3 border-t pt-6">
              <div>
                <p className="text-sm font-semibold text-slate-900">Cover Letter Draft</p>
                <p className="text-xs text-slate-500">
                  Provide the target company and role context to get a personalized draft you can refine.
                </p>
              </div>
              <CoverLetterAIForm slug={(resume as any).slug} action={coverLetterAction} />
            </section>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
