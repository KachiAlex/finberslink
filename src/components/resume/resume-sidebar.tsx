"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ResumeSidebarProps {
  slug: string;
  isOpen?: boolean;
}

export function ResumeSidebar({ slug, isOpen: initialOpen = true }: ResumeSidebarProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 top-1/2 transform -translate-y-1/2 z-40 bg-blue-600 text-white p-2 rounded-l-lg shadow-lg hover:bg-blue-700"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="fixed right-0 top-0 z-40 w-80 h-screen bg-white border-l border-slate-200 shadow-lg overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-slate-900">AI Assistant</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-slate-100 rounded"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Summary Generator</CardTitle>
            <CardDescription className="text-xs">
              Create or improve your professional summary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm" className="w-full" variant="outline">
              Generate Summary
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Bullet Points</CardTitle>
            <CardDescription className="text-xs">
              Enhance experience descriptions with AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-600 mb-2">
              Select an experience entry to enhance its bullet points
            </p>
            <Button size="sm" className="w-full" variant="outline">
              Generate Bullets
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Skill Analysis</CardTitle>
            <CardDescription className="text-xs">
              Discover skills from your experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm" className="w-full" variant="outline">
              Analyze Skills
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">ATS Alignment</CardTitle>
            <CardDescription className="text-xs">
              Check compatibility with job descriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-600 mb-2">
              Paste a job description to see alignment score
            </p>
            <Button size="sm" className="w-full" variant="outline">
              Check ATS Match
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Cover Letter</CardTitle>
            <CardDescription className="text-xs">
              Draft tailored cover letters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-600 mb-2">
              Automatically generate a personalized cover letter
            </p>
            <Button size="sm" className="w-full" variant="outline">
              Draft Cover Letter
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
