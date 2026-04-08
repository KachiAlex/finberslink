"use client";

import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface Template {
  id: string;
  name: string;
  description: string;
  preview: string;
}

interface ResumeTemplateSelectorProps {
  currentTemplate?: string | null;
  onSelect: (templateId: string) => void | Promise<void>;
  disabled?: boolean;
}

const TEMPLATES: Template[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean, contemporary design with colorful accents and sections",
    preview: "📊 Professional with color",
  },
  {
    id: "classic",
    name: "Classic",
    description: "Traditional format, ATS-optimized, universally accepted",
    preview: "📄 Professional & reliable",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Minimalist design with maximum readability and elegance",
    preview: "✨ Simple & elegant",
  },
  {
    id: "executive",
    name: "Executive",
    description: "Formal professional layout with executive summary focus",
    preview: "🎯 Corporate polished",
  },
];

export function ResumeTemplateSelector({
  currentTemplate = "modern",
  onSelect,
  disabled = false,
}: ResumeTemplateSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="h-5 w-5 text-slate-600" />
        <h3 className="text-lg font-semibold text-slate-900">Resume Template</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {TEMPLATES.map((template) => (
          <Card
            key={template.id}
            className={`overflow-hidden cursor-pointer transition-all ${
              currentTemplate === template.id
                ? "ring-2 ring-blue-500 border-blue-200"
                : "hover:border-slate-300"
            }`}
            onClick={() => !disabled && onSelect(template.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {template.description}
                  </CardDescription>
                </div>
                {currentTemplate === template.id && (
                  <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg flex items-center justify-center text-sm text-slate-600 font-medium">
                {template.preview}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-slate-500 mt-4">
        <strong>Tip:</strong> Modern template is best for most opportunities. Classic is ideal for ATS systems.
      </p>
    </div>
  );
}
