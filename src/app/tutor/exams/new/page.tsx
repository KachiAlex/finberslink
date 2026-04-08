"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ExamModule = {
  id: string;
  type: "MCQ" | "SHORT_ANSWER" | "UPLOAD";
  prompt: string;
};

type TargetChoice = { courseId: string; sectionId?: string; kind: "SECTION" | "FINAL" };
type CourseOption = { id: string; title: string; sections: string[] };

type TutorCohortResponse = {
  cohorts?: Array<{
    id: string;
    title: string;
    lessons?: Array<{ title?: string | null } | null> | null;
  }>;
};

type ExamApiResponse = {
  exam?: { id?: string | null } | null;
  error?: string;
};

const getErrorMessage = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

export default function NewExamPage() {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [target, setTarget] = useState<TargetChoice>({ courseId: "", sectionId: undefined, kind: "SECTION" });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [settings, setSettings] = useState({ passingScore: 70, timeLimit: 45, allowReview: true });
  const [modules, setModules] = useState<ExamModule[]>([]);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const res = await fetch("/api/tutor/cohorts");
        if (!res.ok) throw new Error("Failed to load courses");
               const data: TutorCohortResponse = await res.json();
        const normalized: CourseOption[] = (data.cohorts ?? []).map((c) => ({
          id: c.id,
          title: c.title,
          sections: (c.lessons ?? []).map((lesson, idx: number) => lesson?.title ?? `Section ${idx + 1}`),
        }));
        setCourses(normalized);
        if (normalized.length > 0) {
          setTarget({
            courseId: normalized[0].id,
            sectionId: normalized[0].sections[0],
            kind: "SECTION",
          });
        }
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load courses"));
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  const course = useMemo(
    () => courses.find((c) => c.id === target.courseId) ?? courses[0],
    [courses, target.courseId]
  );

  const addModule = (type: ExamModule["type"]) => {
    setModules((prev) => [...prev, { id: crypto.randomUUID(), type, prompt: "" }]);
  };

  const updateModule = (id: string, prompt: string) => {
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, prompt } : m)));
  };

  const removeModule = (id: string) => setModules((prev) => prev.filter((m) => m.id !== id));

  const payload = {
    courseId: target.courseId,
    type: target.kind,
    sectionId: target.kind === "SECTION" ? target.sectionId : null,
    sectionLabel: target.kind === "SECTION" ? target.sectionId : null,
    title,
    description,
    passingScore: settings.passingScore,
    timeLimit: settings.timeLimit,
    modules,
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setSubmitting(false);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/tutor/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data: ExamApiResponse = await res.json();
        throw new Error(data.error ?? "Failed to save draft");
      }
      setSuccess("Draft saved. You can submit for approval from the dashboard.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save draft"));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSaving(false);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/tutor/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data: ExamApiResponse = await res.json();
        throw new Error(data.error ?? "Failed to create exam");
      }
      const data: ExamApiResponse = await res.json();
      const examId = data.exam?.id;
      if (!examId) {
        throw new Error("Exam created but ID missing");
      }
      const submitRes = await fetch(`/api/tutor/exams/${examId}/submit`, { method: "POST" });
      if (!submitRes.ok) {
        const errData: ExamApiResponse = await submitRes.json();
        throw new Error(errData.error ?? "Failed to submit for approval");
      }
      setSuccess("Exam submitted for admin approval.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to submit exam"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ArrowLeft className="h-4 w-4" />
              <Link href="/tutor" className="text-slate-700 hover:text-slate-900">
                Back to tutor dashboard
              </Link>
            </div>
            <h1 className="text-3xl font-semibold text-slate-900">Create exam</h1>
            <p className="text-slate-600">Choose a section or final exam target, add modules, and submit for admin approval.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/tutor/exams">View all exams</Link>
            </Button>
            <Button onClick={handleSaveDraft} disabled={saving || submitting || loadingCourses || !target.courseId}>
              {saving ? "Saving..." : "Save draft"}
            </Button>
          </div>
        </div>

        {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        {success ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">1) Target & metadata</CardTitle>
              <CardDescription>Select course/section and basic exam info.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-slate-700">Course</Label>
                <select
                  value={target.courseId}
                  disabled={loadingCourses || courses.length === 0}
                  onChange={(e) => {
                    const courseId = e.target.value;
                    const newCourse = courses.find((c) => c.id === courseId);
                    setTarget({
                      courseId,
                      kind: target.kind,
                      sectionId: target.kind === "SECTION" ? newCourse?.sections[0] : undefined,
                    });
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                {loadingCourses ? (
                  <p className="text-xs text-slate-500">Loading courses…</p>
                ) : courses.length === 0 ? (
                  <p className="text-xs text-red-600">No courses found. Ensure you are assigned as instructor.</p>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm text-slate-700">Exam type</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={target.kind === "SECTION" ? "default" : "outline"}
                      className="w-full"
                      disabled={!target.courseId || loadingCourses}
                      onClick={() =>
                        setTarget({
                          courseId: target.courseId,
                          kind: "SECTION",
                          sectionId: course?.sections?.[0],
                        })
                      }
                    >
                      Per section
                    </Button>
                    <Button
                      type="button"
                      variant={target.kind === "FINAL" ? "default" : "outline"}
                      className="w-full"
                      disabled={!target.courseId || loadingCourses}
                      onClick={() =>
                        setTarget({
                          courseId: target.courseId,
                          kind: "FINAL",
                          sectionId: undefined,
                        })
                      }
                    >
                      Final exam
                    </Button>
                  </div>
                </div>
                {target.kind === "SECTION" ? (
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-700">Section</Label>
                    <select
                      value={target.sectionId}
                      disabled={!course || (course?.sections?.length ?? 0) === 0}
                      onChange={(e) => setTarget((prev) => ({ ...prev, sectionId: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                    >
                      {(course?.sections ?? []).map((section) => (
                        <option key={section} value={section}>
                          {section}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-700">Final exam</Label>
                    <p className="text-sm text-slate-600">
                      This exam will be required to complete the course.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm text-slate-700">Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., SQL basics assessment" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-700">Passing score</Label>
                  <Input
                    type="number"
                    value={settings.passingScore}
                    onChange={(e) => setSettings((prev) => ({ ...prev, passingScore: Number(e.target.value) }))}
                    min={0}
                    max={100}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm text-slate-700">Time limit (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.timeLimit}
                    onChange={(e) => setSettings((prev) => ({ ...prev, timeLimit: Number(e.target.value) }))}
                    min={5}
                    max={240}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-700">Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What will this exam assess? Add notes for admin reviewers."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">2) Modules</CardTitle>
              <CardDescription>Add blocks (MCQ, short answer, upload).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button variant="outline" type="button" onClick={() => addModule("MCQ")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add MCQ block
                </Button>
                <Button variant="outline" type="button" onClick={() => addModule("SHORT_ANSWER")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add short answer
                </Button>
                <Button variant="outline" type="button" onClick={() => addModule("UPLOAD")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add file upload
                </Button>
              </div>

              {modules.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  No modules yet. Add at least one question block.
                </div>
              ) : (
                <div className="space-y-3">
                  {modules.map((module, idx) => (
                    <div key={module.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                      <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">
                          {idx + 1}. {module.type.replace("_", " ")}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{module.type}</Badge>
                          <Button size="sm" variant="ghost" onClick={() => removeModule(module.id)}>
                            Remove
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        value={module.prompt}
                        onChange={(e) => updateModule(module.id, e.target.value)}
                        placeholder="Prompt or question stem"
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border border-slate-200/70 bg-white/95">
          <CardHeader className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">3) Review & submit</CardTitle>
              <CardDescription>Check targets, settings, and module count before submitting for approval.</CardDescription>
            </div>
            <Badge variant="outline" className="bg-amber-50 text-amber-700">
              Status: Draft
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            <p>
              <strong>Target:</strong> {target.kind === "FINAL" ? "Final exam" : `Section: ${target.sectionId}`} · Course:{" "}
              {course?.title}
            </p>
            <p>
              <strong>Modules:</strong> {modules.length} block{modules.length === 1 ? "" : "s"}
            </p>
            <p>
              <strong>Settings:</strong> Passing {settings.passingScore}% · Time limit {settings.timeLimit} mins
            </p>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" asChild>
                <Link href="/tutor">Cancel</Link>
              </Button>
              <Button
                disabled={modules.length === 0 || submitting || !target.courseId}
                onClick={handleSubmit}
              >
                {submitting ? "Submitting..." : "Submit for approval"}
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              After submission, admins review and can approve or request changes. Editing an approved exam will create a new
              version requiring approval.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
