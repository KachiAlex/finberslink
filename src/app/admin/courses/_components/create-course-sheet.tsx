"use client";

import { Button } from "@/components/ui/button";
import { useCreateCourseModal } from "@/components/course/create-course-modal";

interface CreateCourseSheetProps {
  action: (formData: FormData) => Promise<void>;
  levels: readonly string[];
}

export function CreateCourseSheet({ action: _action, levels: _levels }: CreateCourseSheetProps) {
  const { openModal, closeModal, CreateCourseModal } = useCreateCourseModal("admin");

  return (
    <>
      <Button size="sm" className="min-w-[140px]" onClick={openModal}>
        New course
      </Button>
      <CreateCourseModal />
    </>
  );
}
