"use client";

import { useState, useEffect } from "react";
import { FileText, Save } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function ApplicationForm({ 
  job, 
  slug, 
  userResumes, 
  existingDraft,
  submitApplicationAction,
  saveDraftAction
}: {
  job: any;
  slug: string;
  userResumes: any[];
  existingDraft: any;
  submitApplicationAction: (formData: FormData) => Promise<void>;
  saveDraftAction: (formData: FormData) => Promise<{ success: boolean }>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [formData, setFormData] = useState({
    resumeId: existingDraft?.resumeId || userResumes[0]?.id || "",
    coverLetter: existingDraft?.coverLetter || ""
  });

  useEffect(() => {
    if (existingDraft) {
      setFormData({
        resumeId: existingDraft.resumeId || userResumes[0]?.id || "",
        coverLetter: existingDraft.coverLetter || ""
      });
    }
  }, [existingDraft, userResumes]);

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setSaveMessage("");
    
    try {
      const fd = new FormData();
      fd.append("jobSlug", slug);
      fd.append("resumeId", formData.resumeId);
      fd.append("coverLetter", formData.coverLetter);
      
      const result = await saveDraftAction(fd);
      
      if (result?.success) {
        setSaveMessage("Draft saved successfully!");
      } else {
        setSaveMessage("Failed to save draft");
      }
    } catch (error) {
      setSaveMessage("Failed to save draft");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Draft Status */}
      {existingDraft && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800 text-sm">
            <FileText className="w-4 h-4" />
            <span>Continuing from draft saved {formatDistanceToNow(new Date(existingDraft.lastSavedAt), { addSuffix: true })}</span>
          </div>
        </div>
      )}

      <form className="space-y-6" action={submitApplicationAction}>
        <input type="hidden" name="jobSlug" value={slug} />
        
        {/* Resume Selection */}
        <div>
          <Label htmlFor="resumeId">Select Resume</Label>
          <div className="mt-2 space-y-2">
            {userResumes.map((resume) => (
              <label
                key={resume.id}
                className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name="resumeId"
                  value={resume.id}
                  required
                  checked={formData.resumeId === resume.id}
                  onChange={(e) => setFormData(prev => ({ ...prev, resumeId: e.target.value }))}
                />
                <div className="flex-1">
                  <div className="font-medium">{resume.title}</div>
                  <div className="text-sm text-gray-500">
                    Your resume
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/resume/${resume.slug}`}>
                    View
                  </Link>
                </Button>
              </label>
            ))}
          </div>
        </div>

        {/* Cover Letter */}
        <div>
          <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
          <Textarea
            id="coverLetter"
            name="coverLetter"
            value={formData.coverLetter}
            onChange={(e) => setFormData(prev => ({ ...prev, coverLetter: e.target.value }))}
            placeholder="Tell us why you're interested in this position and why you'd be a great fit..."
            rows={6}
          />
          <p className="text-xs text-gray-500 mt-1">
            This is your chance to stand out! Highlight your relevant experience and skills.
          </p>
        </div>

        {/* Save Draft Button */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? "Saving..." : "Save Draft"}
          </Button>
          
          {saveMessage && (
            <span className={`text-sm ${saveMessage.includes("success") ? "text-green-600" : "text-red-600"}`}>
              {saveMessage}
            </span>
          )}
        </div>

        {/* Submit */}
        <div className="pt-4">
          <Button type="submit" size="lg" className="w-full">
            Submit Application
          </Button>
          <p className="text-xs text-gray-500 text-center mt-2">
            By submitting, you agree to share your resume and contact information with {job.company}
          </p>
        </div>
      </form>
    </div>
  );
}

function formatDistanceToNow(date: Date, options: { addSuffix?: boolean }) {
  // Simple implementation for now
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return "just now";
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
}

export { ApplicationForm };
