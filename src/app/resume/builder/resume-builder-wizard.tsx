"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

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
  targetRolesInput: "",
  yearsExperience: "",
  topSkillsInput: "",
  notableAchievements: "",
  summary: "",
  aiJobTitle: "",
  aiIndustry: "",
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

export function ResumeBuilderWizard() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [achievementStatus, setAchievementStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [achievementMessage, setAchievementMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const canGoNext =
    (step === 1 && Boolean(form.title.trim())) ||
    (step === 2 && Boolean(form.summary.trim() || form.notableAchievements.trim()));

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
      yearsExperience:
        form.yearsExperience.trim() && !Number.isNaN(Number(form.yearsExperience))
          ? Number(form.yearsExperience)
          : undefined,
      topSkills: topSkills.length ? topSkills : undefined,
      skills: topSkills.length ? topSkills : undefined,
      notableAchievements: form.notableAchievements.trim() || undefined,
    };

    try {
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
        router.push(`/resume/${slug}/edit`);
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
    <div className="flex flex-col gap-8">
      <Card className="border-slate-200/70 bg-white/95">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Resume Studio</CardTitle>
          <CardDescription>Create an ATS-ready resume with AI guidance.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {steps.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl border px-4 py-3 text-sm transition ${
                  item.id === step
                    ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                <p className="font-semibold capitalize">Step {item.id}</p>
                <p className="text-xs opacity-80">{item.title}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {step === 1 && (
        <Card className="border-slate-200/70 bg-white/95">
          <CardHeader>
            <CardTitle>Profile & goals</CardTitle>
            <CardDescription>Set the foundation so AI knows what to optimize for.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="title">Resume title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(event) => handleFieldChange("title", event.target.value)}
                  placeholder="e.g., Product Manager Resume"
                  required
                />
              </div>
              <div>
                <Label htmlFor="persona">Persona name (optional)</Label>
                <Input
                  id="persona"
                  value={form.personaName}
                  onChange={(event) => handleFieldChange("personaName", event.target.value)}
                  placeholder="e.g., Growth PM"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(event) => handleFieldChange("location", event.target.value)}
                  placeholder="City, Country"
                />
              </div>
              <div>
                <Label htmlFor="industry">Target industry</Label>
                <Input
                  id="industry"
                  value={form.targetIndustry}
                  onChange={(event) => handleFieldChange("targetIndustry", event.target.value)}
                  placeholder="e.g., Fintech, Edtech"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="roles">Target roles</Label>
                <Input
                  id="roles"
                  value={form.targetRolesInput}
                  onChange={(event) => handleFieldChange("targetRolesInput", event.target.value)}
                  placeholder="Comma separated, e.g., Product Manager, Product Lead"
                />
              </div>
              <div>
                <Label htmlFor="experience">Years of experience</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  value={form.yearsExperience}
                  onChange={(event) => handleFieldChange("yearsExperience", event.target.value)}
                  placeholder="e.g., 5"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-end gap-2">
            <Button disabled={!canGoNext} onClick={handleNextStep}>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <Card className="border-slate-200/70 bg-white/95">
          <CardHeader>
            <CardTitle>Experience & highlights</CardTitle>
            <CardDescription>List key wins so AI can craft high-impact copy.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="skills">Top skills</Label>
              <Input
                id="skills"
                value={form.topSkillsInput}
                onChange={(event) => handleFieldChange("topSkillsInput", event.target.value)}
                placeholder="Comma separated, e.g., Roadmapping, SQL, GTM"
              />
            </div>
            <div>
              <Label htmlFor="achievements">Key achievements / highlights</Label>
              <Textarea
                id="achievements"
                rows={5}
                value={form.notableAchievements}
                onChange={(event) => handleFieldChange("notableAchievements", event.target.value)}
                placeholder={"Share your proudest wins. One per line works great for the AI."}
              />
              <div className="mt-4 space-y-3">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="ai-job-title">Role for AI</Label>
                    <Input
                      id="ai-job-title"
                      value={form.aiJobTitle}
                      onChange={(event) => handleFieldChange("aiJobTitle", event.target.value)}
                      placeholder="e.g., Senior Product Manager"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ai-industry">Industry focus</Label>
                    <Input
                      id="ai-industry"
                      value={form.aiIndustry}
                      onChange={(event) => handleFieldChange("aiIndustry", event.target.value)}
                      placeholder={form.targetIndustry || "e.g., Fintech"}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Provide the role and industry so AI can tailor quantified bullets for this experience.
                  </p>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleGenerateAchievements}
                    disabled={achievementStatus === "loading"}
                  >
                    {achievementStatus === "loading" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Generate achievements
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
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Professional summary</h3>
                  <p className="text-sm text-slate-500">
                    Use AI to create an ATS-friendly summary or write your own.
                  </p>
                </div>
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleGenerateSummary}
                  disabled={aiStatus === "loading"}
                >
                  {aiStatus === "loading" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  Generate with AI
                </Button>
              </div>
              {aiMessage && (
                <p
                  className={`text-sm ${
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
                rows={5}
                value={form.summary}
                onChange={(event) => handleFieldChange("summary", event.target.value)}
                placeholder="Your AI-crafted summary will appear here. Feel free to edit."
              />
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between gap-2">
            <Button variant="ghost" onClick={handlePrevStep}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button disabled={!canGoNext} onClick={handleNextStep}>
              Review summary
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 3 && (
        <Card className="border-slate-200/70 bg-white/95">
          <CardHeader>
            <CardTitle>Review & create</CardTitle>
            <CardDescription>Everything looks good? Generate your resume instantly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" onClick={handlePrevStep}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleCreateResume}
              disabled={isSubmitting || !form.title.trim()}
              className="flex items-center"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {isSubmitting ? "Creating..." : "Create resume with AI"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
