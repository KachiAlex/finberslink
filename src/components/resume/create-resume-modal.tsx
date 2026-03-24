"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ResumeBuilderWizard } from "@/app/resume/builder/resume-builder-wizard";

interface CreateResumeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateResumeModal({ open, onOpenChange }: CreateResumeModalProps) {
  const router = useRouter();

  const handleSuccess = () => {
    onOpenChange(false);
    // Refresh the page to show the new resume in the list
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resume Studio</DialogTitle>
          <DialogDescription>
            Create an ATS-ready resume with AI assistance. Follow the steps to get started.
          </DialogDescription>
        </DialogHeader>
        <ResumeBuilderWizard onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
