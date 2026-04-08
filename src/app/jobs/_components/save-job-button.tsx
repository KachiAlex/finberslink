"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SaveJobButtonProps {
  jobId: string;
  initialSaved?: boolean;
  size?: "sm" | "default";
}

export function SaveJobButton({ jobId, initialSaved = false, size = "sm" }: SaveJobButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const label = saved ? "Saved" : "Save for later";

  const toggleSave = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/jobs/save", {
        method: saved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      if (!res.ok) throw new Error("Failed to update saved job");
      setSaved(!saved);
    } catch (err) {
      console.error(err);
      alert("Could not update saved job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant={saved ? "secondary" : "ghost"} size={size} onClick={toggleSave} disabled={loading}>
      <Bookmark className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
