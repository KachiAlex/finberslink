"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { JobBrowserModal } from "./job-browser-modal";
import { Briefcase, Plus } from "lucide-react";

interface Job {
  id: string;
  slug: string;
  title: string;
  company: string;
  location?: string | null;
  remoteOption?: string | null;
}

interface JobBrowserButtonProps {
  jobs: Job[];
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  showIcon?: boolean;
}

export function JobBrowserButton({
  jobs,
  variant = "default",
  size = "default",
  showIcon = true,
}: JobBrowserButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleApply = (job: Job) => {
    router.push(`/jobs/${job.slug}`);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={variant === "default" ? "bg-blue-600 hover:bg-blue-700" : ""}
      >
        {showIcon && <Briefcase className="mr-2 h-4 w-4" />}
        Browse Jobs
      </Button>
      <JobBrowserModal
        open={open}
        onOpenChange={setOpen}
        jobs={jobs}
        onApply={handleApply}
      />
    </>
  );
}
