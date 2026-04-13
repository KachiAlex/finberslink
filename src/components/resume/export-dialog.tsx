'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2 } from 'lucide-react';

export type TemplateType = 'Modern' | 'Classic' | 'Minimal';

interface ExportDialogProps {
  resumeId: string;
  resumeTitle?: string;
  onExportSuccess?: (downloadUrl: string, fileName: string) => void;
}

interface TemplatePreview {
  name: TemplateType;
  description: string;
  preview: string;
}

const TEMPLATES: TemplatePreview[] = [
  {
    name: 'Modern',
    description: 'Contemporary design with sidebar layout and accent colors',
    preview: 'Modern Template Preview',
  },
  {
    name: 'Classic',
    description: 'Traditional resume format with conservative styling',
    preview: 'Classic Template Preview',
  },
  {
    name: 'Minimal',
    description: 'Clean, simple layout with black and white design',
    preview: 'Minimal Template Preview',
  },
];

export function ExportDialog({
  resumeId,
  resumeTitle = 'Resume',
  onExportSuccess,
}: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('Modern');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/resume/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId,
          template: selectedTemplate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export resume');
      }

      const data = await response.json();

      // Trigger download
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Success',
        description: `Resume exported as ${data.fileName}`,
      });

      if (onExportSuccess) {
        onExportSuccess(data.downloadUrl, data.fileName);
      }

      setOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export as PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Resume as PDF</DialogTitle>
          <DialogDescription>
            Choose a template style for your resume PDF export
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Template</label>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {TEMPLATES.map((template) => (
                <button
                  key={template.name}
                  onClick={() => setSelectedTemplate(template.name)}
                  className={`relative rounded-lg border-2 p-4 text-left transition-all ${
                    selectedTemplate === template.name
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{template.name}</h3>
                      <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                    </div>
                    {selectedTemplate === template.name && (
                      <div className="ml-2 h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg
                          className="h-3 w-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Template Preview */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Preview</label>
            <div className="border rounded-lg bg-gray-50 p-8 min-h-[200px] flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="text-sm">{selectedTemplate} Template Preview</p>
                <p className="text-xs mt-2">
                  Your resume will be exported in {selectedTemplate} style
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
