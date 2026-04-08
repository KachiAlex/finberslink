"use client";

import { useState } from "react";
import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ResumeTemplateWrapper } from "@/components/resume/resume-template-wrapper";

export interface Template {
  id: string;
  name: string;
  description: string;
  preview: string;
}

interface LiveTemplateSelectorProps {
  currentTemplate?: string | null;
  resume: any;
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

export function LiveTemplateSelector({
  currentTemplate = "modern",
  resume,
  disabled = false,
}: LiveTemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(currentTemplate);

  const handleTemplateSelect = async (templateId: string) => {
    setSelectedTemplate(templateId);
    
    // Update the resume template in the database
    try {
      const response = await fetch(`/api/resumes/${resume.slug}/template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ template: templateId }),
      });

      if (!response.ok) {
        console.error('Failed to update template');
        // Revert to original template on error
        setSelectedTemplate(currentTemplate);
      }
    } catch (error) {
      console.error('Error updating template:', error);
      // Revert to original template on error
      setSelectedTemplate(currentTemplate);
    }
  };

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
              selectedTemplate === template.id
                ? "ring-2 ring-blue-500 border-blue-200"
                : "hover:border-slate-300"
            }`}
            onClick={() => !disabled && handleTemplateSelect(template.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {template.description}
                  </CardDescription>
                </div>
                {selectedTemplate === template.id && (
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-center text-sm text-slate-600">
                {template.preview}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live Preview Section */}
      <div className="mt-6">
        <Label className="text-sm font-semibold mb-3 block">Live Preview</Label>
        <div className="border-2 border-slate-200 rounded-lg overflow-hidden bg-white">
          <div className="h-[600px] overflow-auto">
            <ResumeTemplateWrapper
              template={selectedTemplate}
              resume={resume}
              showDownloadAction={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
