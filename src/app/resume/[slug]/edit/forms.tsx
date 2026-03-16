"use client";

import { useState } from "react";

import { AIButton } from "@/components/ai/ai-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface NewExperienceFormProps {
  slug: string;
  action: (formData: FormData) => Promise<void>;
  industryHint?: string | null;
  defaultRole?: string | null;
}

type AiStatus = "idle" | "loading" | "success" | "error";

function sanitizeBulletList(value: string) {
  return value
    .split("\n")
    .map((line) => line.replace(/^[•\-\d.\s]+/, "").trim())
    .filter(Boolean);
}

export function NewExperienceForm({ slug, action, industryHint, defaultRole }: NewExperienceFormProps) {
  const [formValues, setFormValues] = useState({
    company: "",
    role: defaultRole ?? "",
    startDate: "",
    endDate: "",
    rawDescription: "",
    industry: industryHint ?? "",
  });
  const [aiStatus, setAiStatus] = useState<AiStatus>("idle");
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiDraft, setAiDraft] = useState("\u2022 ");
  const [generatedAchievements, setGeneratedAchievements] = useState<string[]>([]);

  const handleFieldChange = (field: keyof typeof formValues) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleAiDraftChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setAiDraft(value);
    setGeneratedAchievements(sanitizeBulletList(value));
  };

  const handleGenerateBullets = async () => {
    if (!formValues.role.trim()) {
      setAiStatus("error");
      setAiMessage("Add a role title so AI knows what to target.");
      return;
    }

    setAiStatus("loading");
    setAiMessage("Asking AI to draft quantified achievements...");

    try {
      const response = await fetch("/api/resume/ai/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          jobTitle: formValues.role.trim(),
          industry: formValues.industry.trim() || undefined,
          experienceHighlights: sanitizeBulletList(formValues.rawDescription).slice(0, 6),
        }),
      });

      if (!response.ok) {
        throw new Error("AI service returned an error");
      }

      const data = await response.json();
      const bullets: string[] = Array.isArray(data.achievements) ? data.achievements : [];
      if (!bullets.length) {
        throw new Error("AI did not return any achievements");
      }

      setGeneratedAchievements(bullets);
      setAiDraft(bullets.join("\n"));
      setAiStatus("success");
      setAiMessage(
        data.usedFallback
          ? "Quota hit—showing locally generated achievements. Review before saving."
          : "AI drafted achievements. Feel free to edit before saving."
      );
    } catch (error) {
      console.error("AI bullet generation failed", error);
      setGeneratedAchievements([]);
      setAiDraft("");
      setAiStatus("error");
      setAiMessage("We couldn't generate achievements right now. Try again in a bit.");
    }
  };

  const handleClearAiDraft = () => {
    setGeneratedAchievements([]);
    setAiDraft("");
    setAiStatus("idle");
    setAiMessage(null);
  };

  const hiddenValue = generatedAchievements.length > 0 ? JSON.stringify(generatedAchievements) : "";
  const aiMessageColor =
    aiStatus === "error" ? "text-rose-600" : aiStatus === "success" ? "text-emerald-600" : "text-slate-500";

  return (
    <form className="space-y-4" action={action}>
      <input type="hidden" name="slug" value={slug} readOnly />
      <input type="hidden" name="generatedAchievements" value={hiddenValue} readOnly />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="company">Company</Label>
          <Input id="company" name="company" placeholder="Company name" value={formValues.company} onChange={handleFieldChange("company")} />
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <Input id="role" name="role" placeholder="Job title" value={formValues.role} onChange={handleFieldChange("role")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input id="startDate" name="startDate" type="month" value={formValues.startDate} onChange={handleFieldChange("startDate")} />
        </div>
        <div>
          <Label htmlFor="endDate">End Date</Label>
          <Input id="endDate" name="endDate" type="month" placeholder="Present" value={formValues.endDate} onChange={handleFieldChange("endDate")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="experience-industry">Industry focus (for AI)</Label>
          <Input
            id="experience-industry"
            placeholder={industryHint || "e.g., Fintech"}
            value={formValues.industry}
            onChange={handleFieldChange("industry")}
          />
        </div>
        <div>
          <Label htmlFor="rawDescription">Job Description (optional)</Label>
          <Textarea
            id="rawDescription"
            name="rawDescription"
            rows={3}
            placeholder="Describe responsibilities or paste bullets..."
            value={formValues.rawDescription}
            onChange={handleFieldChange("rawDescription")}
          />
        </div>
      </div>

      {aiDraft && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="aiDraft">AI Draft Achievements</Label>
            <Button type="button" variant="ghost" size="sm" onClick={handleClearAiDraft}>
              Clear
            </Button>
          </div>
          <Textarea
            id="aiDraft"
            rows={4}
            value={aiDraft}
            onChange={handleAiDraftChange}
            placeholder="AI bullet points will appear here"
          />
          <p className="text-xs text-slate-500">Edit these bullets before saving. We'll store exactly what you keep.</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <AIButton
          variant="outline"
          onClick={handleGenerateBullets}
          disabled={aiStatus === "loading"}
        >
          AI Generate Bullets First
        </AIButton>
        <Button type="submit">Add Experience</Button>
      </div>

      {aiMessage && <p className={`text-xs ${aiMessageColor}`}>{aiMessage}</p>}
    </form>
  );
}

interface NewProjectFormProps {
  slug: string;
  action: (formData: FormData) => Promise<void>;
}

export function NewProjectForm({ slug, action }: NewProjectFormProps) {
  return (
    <form className="space-y-4" action={action}>
      <input type="hidden" name="slug" value={slug} readOnly />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="project-name">Project Name</Label>
          <Input id="project-name" name="name" placeholder="Project name" />
        </div>
        <div>
          <Label htmlFor="project-link">Link (optional)</Label>
          <Input id="project-link" name="link" placeholder="https://..." />
        </div>
      </div>
      <div>
        <Label htmlFor="project-summary">Summary (optional)</Label>
        <Textarea id="project-summary" name="summary" placeholder="Brief project description" rows={3} />
      </div>
      <div>
        <Label htmlFor="project-tech-stack">Tech Stack (comma separated)</Label>
        <Input id="project-tech-stack" name="techStack" placeholder="React, Node, PostgreSQL" />
      </div>
      <Button type="submit">Add Project</Button>
    </form>
  );
}
