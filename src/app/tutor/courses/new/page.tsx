"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LessonFormat, CourseLevel } from "@prisma/client";
import { ArrowLeft, Layers3, Plus, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { slugify } from "@/lib/slugify";
import { TutorExamBuilder, ExamConfig } from "@/components/tutor/exam-builder";

type SectionModule = {
  id: string;
  title: string;
  durationMinutes: number;
  format: LessonFormat;
  summary?: string;
};

type SectionState = {
  id: string;
  title: string;
  modules: SectionModule[];
  draft: {
    title: string;
    duration: string;
    format: LessonFormat;
    summary: string;
  };
  examEnabled: boolean;
  exam: ExamConfig;
};

const LESSON_FORMATS: LessonFormat[] = ["VIDEO", "TEXT", "LIVE"];
const LEVELS: CourseLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

const defaultExamConfig = (label: string): ExamConfig => ({
  title: label,
  description: "",
  passingScore: 70,
  timeLimit: 45,
  modules: [],
});

const createSection = (index: number): SectionState => ({
  id: crypto.randomUUID(),
  title: `Section ${index}`,
  modules: [],
  draft: {
    title: "",
    duration: "15",
    format: "VIDEO",
    summary: "",
  },
  examEnabled: false,
  exam: defaultExamConfig(`Section ${index} quiz`),
});

export default function TutorCourseCreatePage() {
  const router = useRouter();
  const [basics, setBasics] = useState({
    coverImage: "",
    title: "",
    slug: "",
    tagline: "",
    description: "",
    category: "",
    level: "BEGINNER" as CourseLevel,
  });
  const [outcomesInput, setOutcomesInput] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [sections, setSections] = useState<SectionState[]>([createSection(1)]);
  const [finalExamEnabled, setFinalExamEnabled] = useState(false);
  const [finalExam, setFinalExam] = useState<ExamConfig>(defaultExamConfig("Final exam"));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const derivedSlug = useMemo(() => slugify(basics.slug || basics.title || ""), [basics.slug, basics.title]);

  const outcomes = useMemo(
    () =>
      outcomesInput
        .split(/\n|,/)
        .map((item) => item.trim())
        .filter(Boolean),
    [outcomesInput],
  );

  const skills = useMemo(
    () =>
      skillsInput
        .split(/\n|,/)
        .map((item) => item.trim())
        .filter(Boolean),
    [skillsInput],
  );

  const updateSection = (sectionId: string, updater: (section: SectionState) => SectionState) => {
    setSections((prev) => prev.map((section) => (section.id === sectionId ? updater(section) : section)));
  };

  const addSection = () => {
    setSections((prev) => [...prev, createSection(prev.length + 1)]);
  };

  const removeSection = (sectionId: string) => {
    if (sections.length === 1) return;
    setSections((prev) => prev.filter((section) => section.id !== sectionId));
  };

  const addModuleToSection = (sectionId: string) => {
    updateSection(sectionId, (section) => {
      if (!section.draft.title.trim()) return section;
      const module: SectionModule = {
        id: crypto.randomUUID(),
        title: section.draft.title.trim(),
        durationMinutes: Number(section.draft.duration) || 0,
        format: section.draft.format,
        summary: section.draft.summary.trim() || undefined,
      };
      return {
        ...section,
        modules: [...section.modules, module],
        draft: { ...section.draft, title: "", summary: "" },
      };
    });
  };

  const removeModuleFromSection = (sectionId: string, moduleId: string) => {
    updateSection(sectionId, (section) => ({
      ...section,
      modules: section.modules.filter((module) => module.id !== moduleId),
    }));
  };

  const canSubmit =
    basics.title.trim().length > 0 &&
    basics.tagline.trim().length > 0 &&
    basics.description.trim().length > 0 &&
    basics.category.trim().length > 0 &&
    sections.every((section) => section.title.trim().length > 0 && section.modules.length > 0);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        coverImage: basics.coverImage || "https://placehold.co/1200x600",
        title: basics.title.trim(),
        slug: derivedSlug,
        tagline: basics.tagline.trim(),
        description: basics.description.trim(),
        category: basics.category.trim(),
        level: basics.level,
        outcomes,
        skills,
        sections: sections.map((section, index) => ({
          title: section.title.trim(),
          order: index + 1,
          modules: section.modules.map((module) => ({
            title: module.title,
            format: module.format,
            durationMinutes: module.durationMinutes,
            summary: module.summary ?? "",
          })),
          exam:
            section.examEnabled && section.exam.modules.length
              ? {
                  title: section.exam.title,
                  description: section.exam.description,
                  passingScore: section.exam.passingScore,
                  timeLimit: section.exam.timeLimit,
                  modules: section.exam.modules,
                }
              : undefined,
        })),
        finalExam:
          finalExamEnabled && finalExam.modules.length
            ? {
                title: finalExam.title,
                description: finalExam.description,
                passingScore: finalExam.passingScore,
                timeLimit: finalExam.timeLimit,
                modules: finalExam.modules,
              }
            : undefined,
      };

      const res = await fetch("/api/tutor/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create course");
      }

      setSuccess("Course created as draft. Awaiting admin review.");
      setTimeout(() => router.push("/tutor"), 1200);
    } catch (err: any) {
      setError(err.message ?? "Failed to create course");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ArrowLeft className="h-4 w-4" />
              <Link href="/tutor" className="text-slate-700 hover:text-slate-900">
                Back to tutor dashboard
              </Link>
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Create course</h1>
            <p className="text-slate-600">Set up sections, modules, and optional exams in one flow.</p>
          </div>
          <Badge variant="outline" className="bg-amber-50 text-amber-700">
            Draft
          </Badge>
        </div>

        {error ? <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        {success ? (
          <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
        ) : null}

        <Card className="border border-slate-200/70 bg-white/95">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Course details</CardTitle>
            <CardDescription>Basics that appear on student landing pages.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Course title</Label>
                <Input
                  value={basics.title}
                  onChange={(e) => setBasics((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Advanced SQL Bootcamp"
                />
              </div>
              <div className="space-y-1">
                <Label>Slug</Label>
                <Input
                  value={basics.slug}
                  onChange={(e) => setBasics((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="advanced-sql-bootcamp"
                />
                <p className="text-xs text-slate-500">Preview: /courses/{derivedSlug || "slug"}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Tagline</Label>
                <Input
                  value={basics.tagline}
                  onChange={(e) => setBasics((prev) => ({ ...prev, tagline: e.target.value }))}
                  placeholder="One-line promise"
                />
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <Input
                  value={basics.category}
                  onChange={(e) => setBasics((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., Data science"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Cover image URL</Label>
                <Input
                  value={basics.coverImage}
                  onChange={(e) => setBasics((prev) => ({ ...prev, coverImage: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-1">
                <Label>Level</Label>
                <select
                  value={basics.level}
                  onChange={(e) => setBasics((prev) => ({ ...prev, level: e.target.value as CourseLevel }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                >
                  {LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level.toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                value={basics.description}
                onChange={(e) => setBasics((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
                placeholder="Detail what learners will accomplish."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Learning outcomes (comma or newline separated)</Label>
                <Textarea
                  value={outcomesInput}
                  onChange={(e) => setOutcomesInput(e.target.value)}
                  rows={3}
                  placeholder="Build production-grade SQL queries&#10;Optimize analytical workloads"
                />
              </div>
              <div className="space-y-1">
                <Label>Key skills (comma or newline separated)</Label>
                <Textarea
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  rows={3}
                  placeholder="PostgreSQL, Query optimization, Window functions"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Sections & modules</h2>
              <p className="text-sm text-slate-600">Break down your course into digestible segments.</p>
            </div>
            <Button type="button" variant="outline" onClick={addSection}>
              <Plus className="mr-2 h-4 w-4" />
              Add section
            </Button>
          </div>
          {sections.map((section, index) => (
            <Card key={section.id} className="border border-slate-200/70 bg-white/95">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Layers3 className="h-5 w-5 text-slate-500" />
                    Section {index + 1}
                  </CardTitle>
                  <CardDescription>Define learning modules and optionally gate with an exam.</CardDescription>
                </div>
                {sections.length > 1 ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeSection(section.id)}>
                    <Trash className="mr-1 h-4 w-4" />
                    Remove
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label>Section title</Label>
                  <Input
                    value={section.title}
                    onChange={(e) =>
                      updateSection(section.id, (prev) => ({
                        ...prev,
                        title: e.target.value,
                        exam: { ...prev.exam, title: prev.exam.title || `${e.target.value} quiz` },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Add module</Label>
                  <div className="grid gap-2 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_120px_40px]">
                    <Input
                      value={section.draft.title}
                      onChange={(e) =>
                        updateSection(section.id, (prev) => ({ ...prev, draft: { ...prev.draft, title: e.target.value } }))
                      }
                      placeholder="Lesson title"
                    />
                    <Input
                      type="number"
                      min={0}
                      value={section.draft.duration}
                      onChange={(e) =>
                        updateSection(section.id, (prev) => ({ ...prev, draft: { ...prev.draft, duration: e.target.value } }))
                      }
                      placeholder="Duration (min)"
                    />
                    <select
                      value={section.draft.format}
                      onChange={(e) =>
                        updateSection(section.id, (prev) => ({
                          ...prev,
                          draft: { ...prev.draft, format: e.target.value as LessonFormat },
                        }))
                      }
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                    >
                      {LESSON_FORMATS.map((format) => (
                        <option key={format} value={format}>
                          {format.toLowerCase()}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      disabled={!section.draft.title.trim()}
                      onClick={() => addModuleToSection(section.id)}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    value={section.draft.summary}
                    onChange={(e) =>
                      updateSection(section.id, (prev) => ({ ...prev, draft: { ...prev.draft, summary: e.target.value } }))
                    }
                    placeholder="Optional summary"
                  />
                </div>
                {section.modules.length === 0 ? (
                  <p className="rounded border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    No modules yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {section.modules.map((module) => (
                      <div
                        key={module.id}
                        className="flex items-center justify-between rounded border border-slate-100 bg-white px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium text-slate-800">{module.title}</p>
                          <p className="text-xs text-slate-500">
                            {module.format.toLowerCase()} · {module.durationMinutes} min
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeModuleFromSection(section.id, module.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-2 rounded-xl border border-slate-200/70 bg-slate-50/80 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Section exam</h3>
                      <p className="text-xs text-slate-500">Optional assessment before moving to the next section.</p>
                    </div>
                    <Button
                      type="button"
                      variant={section.examEnabled ? "default" : "outline"}
                      onClick={() =>
                        updateSection(section.id, (prev) => ({
                          ...prev,
                          examEnabled: !prev.examEnabled,
                          exam: prev.exam.modules.length ? prev.exam : defaultExamConfig(`${prev.title} quiz`),
                        }))
                      }
                    >
                      {section.examEnabled ? "Enabled" : "Enable"}
                    </Button>
                  </div>
                  {section.examEnabled ? (
                    <TutorExamBuilder
                      value={section.exam}
                      onChange={(config) =>
                        updateSection(section.id, (prev) => ({
                          ...prev,
                          exam: config,
                        }))
                      }
                      title="Section exam"
                    />
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border border-slate-200/70 bg-white/95">
          <CardHeader className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Final exam (optional)</CardTitle>
              <CardDescription>Require a capstone exam before issuing completion.</CardDescription>
            </div>
            <Button
              type="button"
              variant={finalExamEnabled ? "default" : "outline"}
              onClick={() => setFinalExamEnabled((prev) => !prev)}
            >
              {finalExamEnabled ? "Enabled" : "Enable"}
            </Button>
          </CardHeader>
          <CardContent>{finalExamEnabled ? <TutorExamBuilder value={finalExam} onChange={setFinalExam} /> : null}</CardContent>
        </Card>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/95 px-4 py-4">
          <div className="text-sm text-slate-600">
            <p>
              <strong>{sections.length}</strong> sections ·{" "}
              <strong>{sections.reduce((sum, section) => sum + section.modules.length, 0)}</strong> modules
            </p>
            <p>
              Exams configured:{" "}
              {sections.filter((s) => s.examEnabled && s.exam.modules.length).length + (finalExamEnabled && finalExam.modules.length ? 1 : 0)}
            </p>
          </div>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? "Submitting..." : "Submit course for review"}
          </Button>
        </div>
      </div>
    </main>
  );
}
