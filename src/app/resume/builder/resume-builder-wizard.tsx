"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, Wand2, Play } from "lucide-react";

import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Badge } from "../../../components/ui/badge";
import { Textarea } from "../../../components/ui/textarea";
import { Separator } from "../../../components/ui/separator";
import { isVideoUrlValid, toEmbedUrl } from "@/lib/video";

const steps = [
  {
    id: 1,
    title: "Profile & goals",
    description: "Tell us who you are targeting with this resume.",
  },
  {
    id: 2,
    title: "Experience & highlights",
    description: "Capture wins so AI can craft a summary for you.",
  },
  {
    id: 3,
    title: "Review & create",
    description: "Double-check the AI summary before generating your resume.",
  },
];

const initialForm = {
  title: "",
  personaName: "",
  location: "",
  targetIndustry: "",
  introVideoUrl: "",
  targetRolesInput: "",
  topSkillsInput: "",
  notableAchievements: "",
  summary: "",
  aiJobTitle: "",
  aiIndustry: "",
  experiences: [] as Array<{ id: string; role: string; company: string; description: string }> ,
  education: [] as Array<{ id: string; school: string; degree: string; field: string; description?: string }>,
  certificationsInput: "",
};

type FormState = typeof initialForm;

function splitCommaList(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function splitByLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function ResumeBuilderWizard({ onSuccess }: { onSuccess?: () => void } = {}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [achievementStatus, setAchievementStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [achievementMessage, setAchievementMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const canGoNext =
    (step === 1 && Boolean(form.title.trim())) ||
    (step === 2 && Boolean(form.summary.trim() || form.notableAchievements.trim()));

  function addExperience() {
    setForm((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        { id: Date.now().toString(), role: "", company: "", description: "" },
      ],
    }));
  }

  function removeExperience(idx: number) {
    setForm((prev) => ({ ...prev, experiences: prev.experiences.filter((_, i) => i !== idx) }));
  }

  function addEducation() {
    setForm((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { id: Date.now().toString(), school: "", degree: "", field: "", description: "" },
      ],
    }));
  }

  function removeEducation(idx: number) {
    setForm((prev) => ({ ...prev, education: prev.education.filter((_, i) => i !== idx) }));
  }

  const videoEmbedUrl = form.introVideoUrl && isVideoUrlValid(form.introVideoUrl) ? toEmbedUrl(form.introVideoUrl) : null;

  function handleFieldChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleGenerateSummary() {
    setAiStatus("loading");
    setAiMessage("Asking AI to craft your summary...");

    try {
      const response = await fetch("/api/resume/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentSummary: form.summary || undefined,
          experienceHighlights: splitByLines(form.notableAchievements),
          skills: splitCommaList(form.topSkillsInput),
          targetRole: splitCommaList(form.targetRolesInput)[0] || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("AI service returned an error");
      }

      const data = await response.json();
      handleFieldChange("summary", data.summary || "");
      if (data.usedFallback) {
        setAiStatus("success");
        setAiMessage("Using fallback copy while AI quota recovers. Review and tweak if needed.");
        return;
      }
      setAiStatus("success");
      setAiMessage("Summary updated with AI suggestions.");
    } catch (err) {
      console.error("AI summary error", err);
      setAiStatus("error");
      setAiMessage("We couldn't reach the AI right now. Try again in a bit.");
    }
  }

  async function handleGenerateAchievements() {
    if (!form.aiJobTitle.trim()) {
      setAchievementStatus("error");
      setAchievementMessage("Please provide a job title so AI knows what to target.");
      return;
    }

    setAchievementStatus("loading");
    setAchievementMessage("Asking AI to craft quantified achievements...");

    try {
      const response = await fetch("/api/resume/ai/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: form.aiJobTitle.trim(),
          industry: form.aiIndustry.trim() || form.targetIndustry.trim() || undefined,
          experienceHighlights: splitByLines(form.notableAchievements),
        }),
      });

      if (!response.ok) {
        throw new Error("AI service returned an error");
      }

      const data = await response.json();
      const bullets: string[] = Array.isArray(data.achievements) ? data.achievements : [];
      if (!bullets.length) {
        throw new Error("AI did not return any bullets");
      }

      handleFieldChange("notableAchievements", bullets.join("\n"));
      if (data.usedFallback) {
        setAchievementStatus("success");
        setAchievementMessage("Quota hit—showing locally generated achievements. Polish them before continuing.");
        return;
      }
      setAchievementStatus("success");
      setAchievementMessage("Achievements drafted. Feel free to edit them before continuing.");
    } catch (err) {
      console.error("AI achievements error", err);
      setAchievementStatus("error");
      setAchievementMessage("We couldn't generate achievements right now. Try again or tweak the inputs.");
    }
  }

  async function handleCreateResume() {
    setIsSubmitting(true);
    setError(null);

    const targetRoles = splitCommaList(form.targetRolesInput);
    const topSkills = splitCommaList(form.topSkillsInput);
    const payload = {
      title: form.title.trim(),
      summary: form.summary.trim() || undefined,
      personaName: form.personaName.trim() || undefined,
      location: form.location.trim() || undefined,
      targetIndustry: form.targetIndustry.trim() || undefined,
      targetRoles: targetRoles.length ? targetRoles : undefined,
      topSkills: topSkills.length ? topSkills : undefined,
      skills: topSkills.length ? topSkills : undefined,
      notableAchievements: form.notableAchievements.trim() || undefined,
      introVideoUrl: form.introVideoUrl.trim() || undefined,
    };

    try {
      // Persist qualifications to profile first (certifications + education)
      try {
        setCreateMessage("Saving qualifications...");
        const profilePayload: any = {};
        const certs = form.certificationsInput ? splitByLines(form.certificationsInput) : [];
        if (certs.length) profilePayload.certifications = certs;
        if (form.education && form.education.length) profilePayload.education = form.education;

        if (Object.keys(profilePayload).length) {
          await fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(profilePayload),
          });
        }
        setCreateMessage("Creating resume...");
      } catch (e) {
        console.warn("Failed to persist profile qualifications, continuing:", e);
      }

      const response = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to create resume");
      }

      const data = await response.json();
      const slug = data?.resume?.slug;
      if (slug) {
        setCreateMessage(null);
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/resume/${slug}/edit`);
        }
        return;
      }

      throw new Error("Resume created but missing slug");
    } catch (err) {
      console.error("Resume creation failed", err);
      setError(err instanceof Error ? err.message : "Unable to create resume");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleNextStep() {
    if (step < steps.length) {
      setStep((prev) => prev + 1);
    }
  }

  function handlePrevStep() {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Step Indicator */}
      <div className="grid gap-2 sm:grid-cols-3">
        {steps.map((item) => (
          <div
            key={item.id}
            className={`rounded-lg border px-3 py-2 text-xs transition ${
              item.id === step
                ? "border-blue-500 bg-blue-50 text-blue-900"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            <p className="font-semibold">Step {item.id}</p>
            <p className="opacity-75">{item.title}</p>
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Profile & goals</CardTitle>
            <CardDescription className="text-xs">
              Set the foundation so AI knows what to optimize for.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="title" className="text-xs">Resume title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(event) => handleFieldChange("title", event.target.value)}
                  placeholder="e.g., Product Manager Resume"
                  required
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <Label htmlFor="persona" className="text-xs">Persona name (optional)</Label>
                <Input
                  id="persona"
                  value={form.personaName}
                  onChange={(event) => handleFieldChange("personaName", event.target.value)}
                  placeholder="e.g., Growth PM"
                  className="mt-1 h-9"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="location" className="text-xs">Location</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(event) => handleFieldChange("location", event.target.value)}
                  placeholder="City, Country"
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <Label htmlFor="industry" className="text-xs">Target industry</Label>
                <Input
                  id="industry"
                  value={form.targetIndustry}
                  onChange={(event) => handleFieldChange("targetIndustry", event.target.value)}
                  placeholder="e.g., Fintech, Edtech"
                  className="mt-1 h-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="intro-video" className="text-xs">Intro video link (optional)</Label>
              <Input
                id="intro-video"
                value={form.introVideoUrl}
                onChange={(event) => handleFieldChange("introVideoUrl", event.target.value)}
                placeholder="https://youtu.be/..."
                className="mt-1 h-9"
              />
            {/* Experiences list */}
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Experiences</h4>
                <Button size="sm" type="button" onClick={addExperience}>+ Add Experience</Button>
              </div>
              <div className="space-y-3 mt-3">
                {form.experiences.map((exp, idx) => (
                  <div key={exp.id} className="p-3 rounded-lg border bg-slate-50">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input placeholder="Role" value={exp.role} onChange={(e) => setForm(prev => ({ ...prev, experiences: prev.experiences.map((en,i)=> i===idx ? { ...en, role: e.target.value } : en) }))} />
                      <Input placeholder="Company" value={exp.company} onChange={(e) => setForm(prev => ({ ...prev, experiences: prev.experiences.map((en,i)=> i===idx ? { ...en, company: e.target.value } : en) }))} />
                    </div>
                    <Textarea placeholder="Description" rows={2} className="mt-2" value={exp.description} onChange={(e) => setForm(prev => ({ ...prev, experiences: prev.experiences.map((en,i)=> i===idx ? { ...en, description: e.target.value } : en) }))} />
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="ghost" onClick={() => removeExperience(idx)}>Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Education list */}
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Education</h4>
                <Button size="sm" type="button" onClick={addEducation}>+ Add Education</Button>
              </div>
              <div className="space-y-3 mt-3">
                {form.education.map((edu, idx) => (
                  <div key={edu.id} className="p-3 rounded-lg border bg-slate-50">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input placeholder="School / Institution" value={edu.school} onChange={(e) => setForm(prev => ({ ...prev, education: prev.education.map((en,i)=> i===idx ? { ...en, school: e.target.value } : en) }))} />
                      <Input placeholder="Degree" value={edu.degree} onChange={(e) => setForm(prev => ({ ...prev, education: prev.education.map((en,i)=> i===idx ? { ...en, degree: e.target.value } : en) }))} />
                    </div>
                    <Input placeholder="Field of study" className="mt-2" value={edu.field} onChange={(e) => setForm(prev => ({ ...prev, education: prev.education.map((en,i)=> i===idx ? { ...en, field: e.target.value } : en) }))} />
                    <Textarea placeholder="Description (optional)" rows={2} className="mt-2" value={edu.description} onChange={(e) => setForm(prev => ({ ...prev, education: prev.education.map((en,i)=> i===idx ? { ...en, description: e.target.value } : en) }))} />
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="ghost" onClick={() => removeEducation(idx)}>Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
              <p className="mt-1 text-xs text-slate-500">
                YouTube, Vimeo, Google Drive, or Cloudinary. Shows on your resume.
              </p>
              
              {videoEmbedUrl && (
                <div className="mt-3 rounded-lg overflow-hidden border border-slate-200">
                  <div className="aspect-video bg-slate-900">
                    <iframe
                      title="Resume intro video preview"
                      src={videoEmbedUrl}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
              
              {form.introVideoUrl && !videoEmbedUrl && (
                <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="text-xs text-amber-800">
                    Invalid video URL. Please use YouTube, Vimeo, Google Drive, or Cloudinary links.
                  </p>
                </div>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="roles" className="text-xs">Target roles</Label>
                <Input
                  id="roles"
                  value={form.targetRolesInput}
                  onChange={(event) => handleFieldChange("targetRolesInput", event.target.value)}
                  placeholder="Comma separated, e.g., Product Manager, Product Lead"
                  className="mt-1 h-9"
                />
              </div>
            </div>
            {/* Certifications */}
            <div>
              <Label htmlFor="certifications" className="text-xs">Certifications</Label>
              <Textarea
                id="certifications"
                rows={3}
                value={form.certificationsInput}
                onChange={(e) => handleFieldChange("certificationsInput", e.target.value)}
                placeholder="List each certificate on a new line"
                className="mt-1"
              />
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-end gap-2 pt-4">
            <Button size="sm" disabled={!canGoNext} onClick={handleNextStep}>
              Continue
              <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Experience & highlights</CardTitle>
            <CardDescription className="text-xs">
              List key wins so AI can craft high-impact copy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label htmlFor="skills" className="text-xs">Top skills</Label>
              <Input
                id="skills"
                value={form.topSkillsInput}
                onChange={(event) => handleFieldChange("topSkillsInput", event.target.value)}
                placeholder="Comma separated, e.g., Roadmapping, SQL, GTM"
                className="mt-1 h-9"
              />
            </div>
            <div>
              <Label htmlFor="achievements" className="text-xs">Key achievements / highlights</Label>
              <div className="mt-2 mb-2 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="ai-job-title" className="text-xs">Role for AI</Label>
                    <Input
                      id="ai-job-title"
                      value={form.aiJobTitle}
                      onChange={(event) => handleFieldChange("aiJobTitle", event.target.value)}
                      placeholder="e.g., Senior Product Manager"
                      className="mt-1 h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ai-industry" className="text-xs">Industry focus</Label>
                    <Input
                      id="ai-industry"
                      value={form.aiIndustry}
                      onChange={(event) => handleFieldChange("aiIndustry", event.target.value)}
                      placeholder={form.targetIndustry || "e.g., Fintech"}
                      className="mt-1 h-9"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">
                    Tailor bullets for this role and industry.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={handleGenerateAchievements}
                    disabled={achievementStatus === "loading"}
                    className="flex-shrink-0"
                  >
                    {achievementStatus === "loading" ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-3 w-3" />
                    )}
                    Generate
                  </Button>
                </div>
                {achievementMessage && (
                  <p
                    className={`text-sm ${
                      achievementStatus === "error"
                        ? "text-rose-600"
                        : achievementStatus === "success"
                          ? "text-emerald-600"
                          : "text-slate-500"
                    }`}
                  >
                    {achievementMessage}
                  </p>
                )}
              </div>
              <Textarea
                id="achievements"
                rows={4}
                value={form.notableAchievements}
                onChange={(event) => handleFieldChange("notableAchievements", event.target.value)}
                placeholder={"Share your proudest wins. One per line works great for the AI."}
                className="mt-1"
              />
            </div>
            <Separator className="my-3" />
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-semibold text-slate-900">Professional summary</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Use AI to create an ATS-friendly summary or write your own.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={handleGenerateSummary}
                  disabled={aiStatus === "loading"}
                  className="flex-shrink-0"
                >
                  {aiStatus === "loading" ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-3 w-3" />
                  )}
                  Generate
                </Button>
              </div>
              {aiMessage && (
                <p
                  className={`text-xs ${
                    aiStatus === "error"
                      ? "text-rose-600"
                      : aiStatus === "success"
                        ? "text-emerald-600"
                        : "text-slate-500"
                  }`}
                >
                  {aiMessage}
                </p>
              )}
              <Textarea
                id="summary"
                rows={4}
                value={form.summary}
                onChange={(event) => handleFieldChange("summary", event.target.value)}
                placeholder="Your AI-crafted summary will appear here. Feel free to edit."
                className="mt-2"
              />
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between gap-2 pt-4">
            <Button size="sm" variant="ghost" onClick={handlePrevStep}>
              <ArrowLeft className="mr-2 h-3 w-3" />
              Back
            </Button>
            <Button size="sm" disabled={!canGoNext} onClick={handleNextStep}>
              Review summary
              <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 3 && (
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Review & create</CardTitle>
            <CardDescription className="text-xs">
              Everything looks good? Generate your resume instantly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {createMessage && (
              <div className="rounded-md bg-blue-50 border border-blue-100 p-3 text-sm text-blue-700">
                {createMessage}
              </div>
            )}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Summary preview</p>
              <p className="mt-2 text-sm text-slate-700">{form.summary || "No summary yet."}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Target roles</p>
                <p className="mt-1 text-sm text-slate-700">
                  {splitCommaList(form.targetRolesInput).join(", ") || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Top skills</p>
                <p className="mt-1 text-sm text-slate-700">
                  {splitCommaList(form.topSkillsInput).join(", ") || "Not specified"}
                </p>
              </div>
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-2 pt-4">
            <Button size="sm" variant="ghost" onClick={handlePrevStep}>
              <ArrowLeft className="mr-2 h-3 w-3" />
              Back
            </Button>
            <Button
              size="sm"
              onClick={handleCreateResume}
              disabled={isSubmitting || !form.title.trim()}
              className="flex items-center"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-3 w-3" />
              )}
              {isSubmitting ? "Creating..." : "Create resume"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
