"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

interface CreateCourseSheetProps {
  action: (formData: FormData) => Promise<void>;
  levels: readonly string[];
}

export function CreateCourseSheet({ action: _action, levels: _levels }: CreateCourseSheetProps) {
  return (
    <Button size="sm" className="min-w-[140px]" asChild>
      <Link href="/admin/courses/new">New course</Link>
    </Button>
  );
}
