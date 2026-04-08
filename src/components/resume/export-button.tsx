"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportButtonProps {
  resumeId: string;
  resumeTitle: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function ExportButton({ 
  resumeId, 
  resumeTitle, 
  variant = "outline", 
  size = "sm",
  className = ""
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);

    try {
      console.log(`Starting PDF export for resume ${resumeId}`);
      
      const response = await fetch(`/api/resumes/${resumeId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format: 'pdf' }),
      });

      console.log(`Export response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.details || `Export failed with status ${response.status}`;
        console.error('Export error response:', errorData);
        throw new Error(errorMessage);
      }

      // PDF download
      const blob = await response.blob();
      console.log(`PDF blob size: ${blob.size} bytes`);
      
      if (blob.size === 0) {
        throw new Error('Received empty PDF file');
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${resumeTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_resume.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "PDF downloaded successfully!",
      });
    } catch (error) {
      console.error('Export error:', error);
      
      let errorMessage = "Failed to export resume. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes('Failed to generate PDF')) {
          errorMessage = "PDF generation failed. Please try again or contact support.";
        } else if (error.message.includes('Resume not found')) {
          errorMessage = "Resume not found. Please refresh the page and try again.";
        } else if (error.message.includes('Unauthorized')) {
          errorMessage = "You are not authorized to export this resume.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: errorMessage,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={isExporting}
      className={`relative ${className}`}
    >
      {isExporting ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <Download className="h-4 w-4" />
      )}
      <span className={isExporting ? "opacity-0" : "opacity-100"}>
        {isExporting ? "Exporting..." : "Export PDF"}
      </span>
    </Button>
  );
}
