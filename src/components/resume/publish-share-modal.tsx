"use client";

import { useState } from "react";
import { Copy, Check, Lock, Users, Globe, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { ResumeVisibility } from "@prisma/client";

interface PublishShareModalProps {
  slug: string;
  shareSlug: string;
  currentVisibility: ResumeVisibility;
  shareUrl: string;
  onVisibilityChange: (visibility: ResumeVisibility) => Promise<void>;
  onRegenerateSlug: () => Promise<void>;
  trigger?: React.ReactNode;
}

export function PublishShareModal({
  slug,
  shareSlug,
  currentVisibility,
  shareUrl,
  onVisibilityChange,
  onRegenerateSlug,
  trigger,
}: PublishShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVisibilityChange = async (visibility: ResumeVisibility) => {
    setIsUpdating(true);
    try {
      await onVisibilityChange(visibility);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRegenerateSlug = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerateSlug();
    } finally {
      setIsRegenerating(false);
    }
  };

  const visibilityOptions: Array<{ value: ResumeVisibility; icon: React.ReactNode; label: string; description: string }> = [
    {
      value: "PRIVATE",
      icon: <Lock className="h-4 w-4" />,
      label: "Private",
      description: "Only you can see this resume",
    },
    {
      value: "NETWORK",
      icon: <Users className="h-4 w-4" />,
      label: "Network",
      description: "Share with specific people via link",
    },
    {
      value: "PUBLIC",
      icon: <Globe className="h-4 w-4" />,
      label: "Public",
      description: "Anyone can find and view your resume",
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || <Button>Publish & Share</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Publish & Share Your Resume</DialogTitle>
          <DialogDescription>
            Control who can see your resume and create a shareable link
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Visibility Options */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-900">
              Resume Visibility
            </label>
            <div className="space-y-2">
              {visibilityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleVisibilityChange(option.value)}
                  disabled={isUpdating}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                    currentVisibility === option.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  } disabled:opacity-50`}
                >
                  <div className="flex items-start gap-3">
                    <div className={currentVisibility === option.value ? "text-blue-600" : "text-slate-600"}>
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-slate-900">{option.label}</p>
                      <p className="text-xs text-slate-600">{option.description}</p>
                    </div>
                    {currentVisibility === option.value && (
                      <Check className="h-4 w-4 text-blue-600 mt-1" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Shareable Link */}
          <div className="space-y-3 border-t pt-4">
            <label className="text-sm font-semibold text-slate-900">
              Shareable Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={copyToClipboard}
                className="whitespace-nowrap"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            {/* Link Management */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Share ID:</span>
                <Badge variant="secondary" className="text-xs">
                  {shareSlug}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="w-full text-xs justify-start pl-0"
                onClick={handleRegenerateSlug}
                disabled={isRegenerating}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Generate New Link
              </Button>
            </div>

            {currentVisibility !== "PUBLIC" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-900">
                  💡 <strong>Tip:</strong> Set visibility to <strong>Public</strong> so your share link works for everyone
                </p>
              </div>
            )}
          </div>

          {/* Preview Link */}
          <div className="flex gap-2">
            <Button
              asChild
              variant="secondary"
              className="flex-1"
            >
              <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                Open Preview
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
