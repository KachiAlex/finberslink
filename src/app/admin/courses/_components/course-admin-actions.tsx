"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type ActionType = "archive" | "restore" | "approve-edit" | "reject-edit";

type CourseAdminActionsProps = {
  courseId: string;
  action: ActionType;
  label: string;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  className?: string;
};

const endpointByAction: Record<ActionType, string> = {
  archive: "archive",
  restore: "restore",
  "approve-edit": "approve-edit",
  "reject-edit": "reject-edit",
};

export function CourseAdminActionButton({
  courseId,
  action,
  label,
  variant = "outline",
  className,
}: CourseAdminActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const onClick = async () => {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/${endpointByAction[action]}`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Action failed");
      }
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Action failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <Button type="button" size="sm" variant={variant} className={className} onClick={onClick} disabled={pending}>
      {pending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
      {label}
    </Button>
  );
}
