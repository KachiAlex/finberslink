"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface DeleteCourseDialogProps {
  course: {
    id: string;
    title: string;
    slug: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteSuccess?: () => void;
}

export function DeleteCourseDialog({
  course,
  open,
  onOpenChange,
  onDeleteSuccess,
}: DeleteCourseDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/tutor/courses/${course.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete course");
      }

      onDeleteSuccess?.();
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete course";
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle>Delete Course</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{course.title}"?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 space-y-2">
          <p className="font-medium">This action cannot be undone.</p>
          <ul className="list-disc list-inside space-y-1 text-red-600">
            <li>All course content and lessons will be permanently deleted</li>
            <li>Enrolled students will lose access to this course</li>
            <li>All course data will be removed from the system</li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Course"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
