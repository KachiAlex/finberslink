"use client";

import type { ChangeEvent } from "react";
import { useMemo, useRef, useState } from "react";
import { AlertTriangle, Loader2, Plus, Trash, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ExamImportIssue = {
  row: number;
  message: string;
};

type ImportedExamModule = {
  id: string;
  type: "MCQ" | "SHORT_ANSWER" | "UPLOAD";
  prompt: string;
  choices?: string[];
  answer?: string;
};

export type ExamModule = {
  id: string;
  type: "MCQ" | "SHORT_ANSWER" | "UPLOAD";
  prompt: string;
  choices?: string[];
  answer?: string;
};

export type ExamConfig = {
  title: string;
  description?: string;
  passingScore?: number;
  timeLimit?: number;
  modules: ExamModule[];
};

type Props = {
  value: ExamConfig;
  onChange: (_config: ExamConfig) => void;
  title?: string;
};

export function TutorExamBuilder({ value, onChange, title = "Exam settings" }: Props) {
  const [modulePrompt, setModulePrompt] = useState("");
  const [moduleType, setModuleType] = useState<ExamModule["type"]>("MCQ");
  const canAdd = modulePrompt.trim().length > 0;
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importIssues, setImportIssues] = useState<ExamImportIssue[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAddModule = () => {
    if (!canAdd) return;
    const newModule: ExamModule = {
      id: crypto.randomUUID(),
      type: moduleType,
      prompt: modulePrompt.trim(),
    };
    onChange({ ...value, modules: [...value.modules, newModule] });
    setModulePrompt("");
  };

  const handleRemoveModule = (id: string) => {
    onChange({ ...value, modules: value.modules.filter((m) => m.id !== id) });
  };

  const summary = useMemo(
    () => `${value.modules.length} module${value.modules.length === 1 ? "" : "s"}`,
    [value.modules.length],
  );

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportStatus("idle");
    setImportMessage(null);
    setImportIssues([]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/tutor/exams/import", { method: "POST", body: formData });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Import failed");
      }

      const modules = (Array.isArray(payload.modules) ? payload.modules : []) as ImportedExamModule[];
      const issues = (Array.isArray(payload.issues) ? payload.issues : []) as ExamImportIssue[];
      setImportIssues(issues);

      if (modules.length) {
        onChange({ ...value, modules: [...value.modules, ...modules] });
        setImportStatus("success");
        setImportMessage(`Imported ${modules.length} question${modules.length === 1 ? "" : "s"}.`);
      } else {
        setImportStatus("error");
        setImportMessage("No valid questions found. Fix the spreadsheet and try again.");
      }
    } catch (error) {
      console.error("Exam import error", error);
      setImportStatus("error");
      setImportMessage(error instanceof Error ? error.message : "Unable to import file");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  return (
    <Card className="border border-slate-200/70 bg-white">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
        <p className="text-sm text-slate-500">{summary}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Exam title</Label>
            <Input
              value={value.title}
              onChange={(e) => onChange({ ...value, title: e.target.value })}
              placeholder="e.g., Final assessment"
            />
          </div>
          <div className="space-y-1">
            <Label>Passing score (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={value.passingScore ?? 70}
              onChange={(e) => onChange({ ...value, passingScore: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Time limit (minutes)</Label>
            <Input
              type="number"
              min={5}
              max={240}
              value={value.timeLimit ?? 45}
              onChange={(e) => onChange({ ...value, timeLimit: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              value={value.description ?? ""}
              onChange={(e) => onChange({ ...value, description: e.target.value })}
              placeholder="Exam notes for admin reviewers"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Add module</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={moduleType}
              onChange={(e) => setModuleType(e.target.value as ExamModule["type"])}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 sm:max-w-[150px]"
            >
              <option value="MCQ">MCQ</option>
              <option value="SHORT_ANSWER">Short answer</option>
              <option value="UPLOAD">Upload</option>
            </select>
            <Input
              value={modulePrompt}
              onChange={(e) => setModulePrompt(e.target.value)}
              placeholder="Prompt or question"
            />
            <Button type="button" variant="outline" onClick={handleAddModule} disabled={!canAdd}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-slate-800">Import from Excel</p>
                <p className="text-xs text-slate-500">
                  Columns: Question, Type, Option A-D, Answer. Supports MCQ, True/False, Short answer, Upload.
                </p>
              </div>
              <Button type="button" size="sm" onClick={handleImportClick} disabled={importing}>
                {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {importing ? "Importing..." : "Upload Excel"}
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={handleImportFile}
            />
            {importMessage ? (
              <p
                className={`mt-3 text-xs ${
                  importStatus === "error" ? "text-rose-600" : importStatus === "success" ? "text-emerald-600" : "text-slate-500"
                }`}
              >
                {importMessage}
              </p>
            ) : null}
          </div>
          {importIssues.length ? (
            <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" />
                {importIssues.length} validation issue{importIssues.length === 1 ? "" : "s"}
              </div>
              <ul className="space-y-1">
                {importIssues.map((issue) => (
                  <li key={`${issue.row}-${issue.message}`}>
                    Row {issue.row}: {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {value.modules.length === 0 ? (
          <p className="rounded border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            No modules yet. Add at least one block.
          </p>
        ) : (
          <div className="space-y-3">
            {value.modules.map((module, idx) => (
              <div key={module.id} className="rounded border border-slate-200 bg-white px-3 py-3">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    {idx + 1}. {module.type.replace("_", " ")}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveModule(module.id)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2 text-sm text-slate-700">
                  <p>{module.prompt}</p>
                  {module.choices?.length ? (
                    <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600">
                      {module.choices.map((choice, choiceIdx) => (
                        <li key={`${module.id}-choice-${choiceIdx}`}>
                          <span className="font-semibold text-slate-700">
                            {String.fromCharCode(65 + choiceIdx)}.
                          </span>{" "}
                          {choice}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {module.answer ? (
                    <p className="text-xs font-semibold text-emerald-700">Correct answer: {module.answer}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
