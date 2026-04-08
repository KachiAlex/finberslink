"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Zap, Share2, FileText } from "lucide-react";
import { ResumeTemplateWrapper } from "./resume-template-wrapper";
import { ResumeTemplateSelector } from "./resume-template-selector";
import { ResumeSidebar } from "./resume-sidebar";
import type { Resume } from "@prisma/client";

interface UnifiedEditorProps {
  resume: Resume;
  onTemplateChange: (templateId: string) => Promise<void>;
  children: React.ReactNode; // Form sections
}

export function UnifiedEditor({
  resume,
  onTemplateChange,
  children,
}: UnifiedEditorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(resume.template || "modern");
  const [isUpdatingTemplate, setIsUpdatingTemplate] = useState(false);

  const handleTemplateChange = async (templateId: string) => {
    setSelectedTemplate(templateId);
    setIsUpdatingTemplate(true);
    try {
      await onTemplateChange(templateId);
    } finally {
      setIsUpdatingTemplate(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900">Resume Studio</h1>
          <p className="text-slate-600">Build and preview your resume in real-time</p>
        </header>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          {/* Left Panel: Forms & Settings */}
          <div className="space-y-6">
            {/* Tabs for different editor sections */}
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-200">
                <TabsTrigger value="basic" className="text-xs sm:text-sm">
                  <FileText className="h-4 w-4 mr-1" />
                  Basic
                </TabsTrigger>
                <TabsTrigger value="content" className="text-xs sm:text-sm">
                  <FileText className="h-4 w-4 mr-1" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="design" className="text-xs sm:text-sm">
                  <Palette className="h-4 w-4 mr-1" />
                  Design
                </TabsTrigger>
                <TabsTrigger value="ai" className="text-xs sm:text-sm">
                  <Zap className="h-4 w-4 mr-1" />
                  AI
                </TabsTrigger>
              </TabsList>

              {/* Tab content */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                {/* Forms will be rendered here */}
              </TabsContent>

              <TabsContent value="content" className="space-y-4 mt-4">
                {/* Experience, Projects, Skills forms */}
              </TabsContent>

              <TabsContent value="design" className="space-y-4 mt-4 p-4 border rounded-lg bg-white">
                <h3 className="font-semibold text-slate-900">Template Selection</h3>
                <ResumeTemplateSelector
                  currentTemplate={selectedTemplate}
                  onSelect={handleTemplateChange}
                  disabled={isUpdatingTemplate}
                />
              </TabsContent>

              <TabsContent value="ai" className="space-y-4 mt-4">
                {/* AI features sidebar content */}
              </TabsContent>
            </Tabs>

            {/* Form sections container */}
            <div className="space-y-4">
              {children}
            </div>
          </div>

          {/* Right Panel: Live Preview */}
          <div className="sticky top-8 h-[calc(100vh-100px)] overflow-y-auto bg-slate-900 rounded-lg shadow-xl border border-slate-800">
            <div className="h-full overflow-auto">
              <ResumeTemplateWrapper
                template={selectedTemplate}
                resume={resume}
              />
            </div>
          </div>
        </div>

        {/* Publish Bar */}
        <div className="sticky bottom-0 z-50 mt-8 border-t bg-white shadow-lg p-4">
          <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              Status: <strong>{resume.visibility}</strong>
            </p>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Share2 className="h-4 w-4" />
              Publish & Share
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
