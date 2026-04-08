"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Archive, RotateCcw, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

const actionMessages = {
  archive: {
    title: "Archive Course",
    description: "Are you sure you want to archive this course? This will remove it from the live catalog but keep all data intact. You can restore it later if needed.",
    icon: Archive,
    confirmText: "Archive",
    variant: "destructive" as const,
  },
  restore: {
    title: "Restore Course",
    description: "Are you sure you want to restore this course? This will make it available in the live catalog again.",
    icon: RotateCcw,
    confirmText: "Restore",
    variant: "default" as const,
  },
  "approve-edit": {
    title: "Approve Course Edit",
    description: "Are you sure you want to approve these course edits? This will update the live course with the tutor's changes.",
    icon: Check,
    confirmText: "Approve",
    variant: "default" as const,
  },
  "reject-edit": {
    title: "Reject Course Edit",
    description: "Are you sure you want to reject these course edits? The tutor will need to make new changes.",
    icon: X,
    confirmText: "Reject",
    variant: "destructive" as const,
  },
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
  const [showConfirm, setShowConfirm] = useState(false);

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

  const handleConfirm = () => {
    setShowConfirm(false);
    onClick();
  };

  const actionConfig = actionMessages[action];
  const Icon = actionConfig.icon;

  return (
    <>
      <Button 
        type="button" 
        size="sm" 
        variant={variant} 
        className={className} 
        onClick={() => setShowConfirm(true)} 
        disabled={pending}
      >
        {pending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
        {label}
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                action === "archive" || action === "reject-edit" 
                  ? "bg-rose-100 text-rose-600" 
                  : "bg-emerald-100 text-emerald-600"
              }`}>
                <Icon className="h-5 w-5" />
              </div>
              <DialogTitle>{actionConfig.title}</DialogTitle>
            </div>
            <DialogDescription>
              {actionConfig.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button 
              variant={actionConfig.variant} 
              onClick={handleConfirm}
              disabled={pending}
            >
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {actionConfig.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
