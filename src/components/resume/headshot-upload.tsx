"use client";

import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface HeadshotUploadProps {
  slug: string;
  currentHeadshot?: string | null;
  isLoading?: boolean;
}

export function HeadshotUpload({ slug, currentHeadshot, isLoading = false }: HeadshotUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentHeadshot ?? null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please select an image file",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "File size must be less than 5MB",
      });
      return;
    }

    setUploading(true);
    try {
      // Create FormData
      const formData = new FormData();
      formData.append("file", file);

      // Upload to server
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      const imageUrl = data.url;

      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Update the resume with the new headshot URL
      const updateFormData = new FormData();
      updateFormData.append("slug", slug);
      updateFormData.append("headshotUrl", imageUrl);

      const updateResponse = await fetch(`/api/resumes/${slug}/update`, {
        method: "POST",
        body: updateFormData,
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update resume with headshot");
      }
      
      toast({
        title: "Success!",
        description: "Headshot uploaded successfully!",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image. Please try again.",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async () => {
    setPreview(null);
    
    try {
      // Update the resume to remove headshot
      const updateFormData = new FormData();
      updateFormData.append("slug", slug);
      updateFormData.append("headshotUrl", "");

      const updateResponse = await fetch(`/api/resumes/${slug}/update`, {
        method: "POST",
        body: updateFormData,
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to remove headshot");
      }
      
      toast({
        title: "Removed",
        description: "Headshot removed successfully",
      });
    } catch (error) {
      console.error("Remove error:", error);
      toast({
        variant: "destructive",
        title: "Remove failed",
        description: "Failed to remove headshot",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold">Headshot / Passport Photo</Label>
      
      {preview ? (
        <div className="relative w-32 h-32">
          <img
            src={preview}
            alt="Headshot preview"
            className="w-full h-full rounded-lg object-cover border-2 border-slate-200"
          />
          <button
            onClick={handleRemove}
            disabled={uploading || isLoading}
            className="absolute top-0 right-0 -translate-x-2 -translate-y-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 disabled:opacity-50"
            title="Remove headshot"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full">
          <label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-6 cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-all">
            <Upload className="h-8 w-8 text-slate-400 mb-2" />
            <span className="text-sm font-medium text-slate-700">Upload headshot</span>
            <span className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading || isLoading}
              className="hidden"
            />
          </label>
        </div>
      )}

      {uploading || isLoading ? (
        <p className="text-sm text-slate-500">Uploading...</p>
      ) : null}

      <p className="text-xs text-slate-500">
        Square or portrait format works best. Your photo will appear on the resume header.
      </p>
    </div>
  );
}
