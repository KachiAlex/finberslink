"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface ResumeEditFormProps {
  slug: string;
  initialTitle: string;
  initialPersonaName: string;
  initialSummary: string;
  onSubmit?: (success: boolean, message: string) => void;
}

export function ResumeEditForm({ 
  slug, 
  initialTitle, 
  initialPersonaName, 
  initialSummary,
  onSubmit 
}: ResumeEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch(`/api/resumes/${slug}/update`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        toast({
          title: "Success!",
          description: "Resume updated successfully!",
        });
        onSubmit?.(true, "Resume updated successfully!");
        // Refresh the page to show updated data
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update resume",
        });
        onSubmit?.(false, "Failed to update resume");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error updating resume",
      });
      onSubmit?.(false, "Error updating resume");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="slug" value={slug} />
      <div className="space-y-2">
        <Label htmlFor="personaName">Your Name</Label>
        <Input id="personaName" name="personaName" defaultValue={initialPersonaName} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={initialTitle} required />
      </div>
      <Button type="submit" disabled={isSubmitting} className="relative">
        {isSubmitting && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <span className={isSubmitting ? "opacity-0" : "opacity-100"}>
          {isSubmitting ? "Saving..." : "Save"}
        </span>
      </Button>
    </form>
  );
}

export function SummaryEditForm({ 
  slug, 
  initialSummary,
  onSubmit 
}: { 
  slug: string; 
  initialSummary: string;
  onSubmit?: (success: boolean, message: string) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch(`/api/resumes/${slug}/update`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        toast({
          title: "Success!",
          description: "Summary updated successfully!",
        });
        onSubmit?.(true, "Summary updated successfully!");
        // Refresh the page to show updated data
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update summary",
        });
        onSubmit?.(false, "Failed to update summary");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error updating summary",
      });
      onSubmit?.(false, "Error updating summary");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="slug" value={slug} />
      <Textarea 
        name="summary" 
        defaultValue={initialSummary} 
        rows={4}
        placeholder="Write a brief summary of your professional background..."
      />
      <div className="flex gap-2">
        <Button type="submit" variant="outline" disabled={isSubmitting} className="relative">
          {isSubmitting && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <span className={isSubmitting ? "opacity-0" : "opacity-100"}>
            {isSubmitting ? "Saving..." : "Save"}
          </span>
        </Button>
      </div>
    </form>
  );
}
