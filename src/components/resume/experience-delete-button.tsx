"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

interface ExperienceDeleteButtonProps {
  slug: string;
  experienceId: string;
}

export function ExperienceDeleteButton({ slug, experienceId }: ExperienceDeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!confirm("Are you sure you want to delete this experience?")) {
      return;
    }

    setIsDeleting(true);
    
    try {
      const formData = new FormData();
      formData.append("slug", slug);
      formData.append("experienceId", experienceId);

      // Create a delete endpoint call
      const response = await fetch(`/api/resumes/${slug}/experience/${experienceId}/delete`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Experience Deleted",
          description: "Experience deleted successfully!",
        });
        // Refresh the page to show updated data
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: "Failed to delete experience",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Error deleting experience",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button 
      variant="destructive" 
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
      className="relative"
    >
      {isDeleting && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <span className={`flex items-center gap-2 ${isDeleting ? "opacity-0" : "opacity-100"}`}>
        <Trash2 className="w-4 h-4" />
        {isDeleting ? "Deleting..." : "Delete Experience"}
      </span>
    </Button>
  );
}
