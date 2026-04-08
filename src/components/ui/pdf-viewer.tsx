"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download, FileText, Loader2, AlertCircle } from "lucide-react";

interface PDFViewerProps {
  url: string;
  title?: string;
  className?: string;
  width?: number;
  height?: number;
}

export function PDFViewer({ 
  url, 
  title = "PDF Document", 
  className = "", 
  width = 800, 
  height = 600 
}: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [isDirectPDF, setIsDirectPDF] = useState(false);

  useEffect(() => {
    const processPdfUrl = (pdfUrl: string) => {
      // Check if it's a direct PDF URL
      if (pdfUrl.toLowerCase().endsWith('.pdf')) {
        setIsDirectPDF(true);
        setPdfUrl(pdfUrl);
        return;
      }

      // Handle Google Drive PDFs
      const gdriveMatch = pdfUrl.match(/drive\.google\.com\/.*?id=([^&\n?#]+)/);
      if (gdriveMatch) {
        const directUrl = `https://drive.google.com/uc?export=download&id=${gdriveMatch[1]}`;
        setPdfUrl(directUrl);
        return;
      }

      // Handle OneDrive PDFs
      const onedriveMatch = pdfUrl.match(/onedrive\.live\.com\/.*?id=([^&\n?#]+)/);
      if (onedriveMatch) {
        const directUrl = `https://onedrive.live.com/download?cid=${onedriveMatch[1]}`;
        setPdfUrl(directUrl);
        return;
      }

      // For other URLs, use as-is
      setPdfUrl(pdfUrl);
    };

    processPdfUrl(url);
  }, [url]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = title.endsWith('.pdf') ? title : `${title}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewInNewTab = () => {
    window.open(pdfUrl, '_blank');
  };

  if (hasError) {
    return (
      <div className={cn("bg-slate-100 rounded-lg flex flex-col items-center justify-center", className)} style={{ width, height }}>
        <AlertCircle className="h-12 w-12 text-slate-400 mb-3" />
        <div className="text-center">
          <div className="text-lg font-semibold text-slate-700 mb-2">Failed to load PDF</div>
          <div className="text-sm text-slate-600 mb-4">The PDF may be unavailable or corrupted</div>
          <Button onClick={handleViewInNewTab} variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Try Opening in New Tab
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-lg border border-slate-200 overflow-hidden", className)} style={{ width, height }}>
      {/* Header with download button */}
      <div className="flex items-center justify-between p-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-slate-600" />
          <span className="text-sm font-medium text-slate-700 truncate max-w-xs">{title}</span>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleViewInNewTab} variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Open
          </Button>
          <Button onClick={handleDownload} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center" style={{ height: height - 60 }}>
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 mb-3" />
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-700 mb-2">Loading PDF...</div>
            <div className="text-sm text-slate-600">Please wait while we prepare your document</div>
          </div>
        </div>
      )}

      {/* PDF Viewer */}
      {!isLoading && !hasError && (
        <div className="w-full" style={{ height: height - 60 }}>
          {isDirectPDF ? (
            // For direct PDF URLs, use iframe
            <iframe
              src={pdfUrl}
              width="100%"
              height="100%"
              className="border-0"
              title={title}
              onLoad={handleLoad}
              onError={handleError}
            />
          ) : (
            // For Google Drive/OneDrive, use embed viewer
            <iframe
              src={`https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(pdfUrl)}`}
              width="100%"
              height="100%"
              className="border-0"
              title={title}
              onLoad={handleLoad}
              onError={handleError}
            />
          )}
        </div>
      )}

      {/* Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>PDF Document • {Math.round((width * height) / 10000)}KB estimated</span>
          <span>Click Download to save locally</span>
        </div>
      </div>
    </div>
  );
}
