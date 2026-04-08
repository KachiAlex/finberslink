"use client";

import { useState } from "react";
import { CreateResumeModal } from "@/components/resume/create-resume-modal";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CreateResumeButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Create Resume
      </Button>
      <CreateResumeModal open={open} onOpenChange={setOpen} />
    </>
  );
}
