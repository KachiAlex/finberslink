"use client";

import { useMemo, useState } from "react";
import { Plus, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type ExamModule = {
  id: string;
  type: "MCQ" | "SHORT_ANSWER" | "UPLOAD";
  prompt: string;
  choices?: string[];
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
  onChange: (config: ExamConfig) => void;
  title?: string;
};

export function TutorExamBuilder({ value, onChange, title = "Exam settings" }: Props) {
  const [modulePrompt, setModulePrompt] = useState("");
  const [moduleType, setModuleType] = useState<ExamModule["type"]>("MCQ");
  const canAdd = modulePrompt.trim().length > 0;

  const handleAddModule = () => {
    if (!canAdd) return;
    const module: ExamModule = {
      id: crypto.randomUUID(),
      type: moduleType,
      prompt: modulePrompt.trim(),
    };
    onChange({ ...value, modules: [...value.modules, module] });
    setModulePrompt("");
  };

  const handleRemoveModule = (id: string) => {
    onChange({ ...value, modules: value.modules.filter((m) => m.id !== id) });
  };

  const summary = useMemo(
    () => `${value.modules.length} module${value.modules.length === 1 ? "" : "s"}`,
    [value.modules.length],
  );

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
                <p className="text-sm text-slate-700">{module.prompt}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
