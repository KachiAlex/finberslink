"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type CourseApprovalStatus = "PENDING" | "APPROVED" | "CHANGES";

const ACTION_SUCCESS_COPY: Record<CourseApprovalStatus, string> = {
  APPROVED: "Course approved",
  CHANGES: "Requested tutor edits",
  PENDING: "Status reset to pending",
};

const STATUS_LABEL: Record<CourseApprovalStatus, string> = {
  APPROVED: "Approve",
  CHANGES: "Request edits",
  PENDING: "Mark pending",
};

type Props = {
  courseId: string;
  currentStatus: CourseApprovalStatus;
};

export function CourseActionButtons({ courseId, currentStatus }: Props) {
  const router = useRouter();
  const [pendingStatus, setPendingStatus] = useState<CourseApprovalStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const triggerUpdate = (nextStatus: CourseApprovalStatus) => {
    setPendingStatus(nextStatus);
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/courses/${courseId}/status`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: nextStatus }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error ?? "Failed to update course status");
        }

        setMessage(ACTION_SUCCESS_COPY[nextStatus]);
        router.refresh();
      } catch (err) {
        const fallback = err instanceof Error ? err.message : "Failed to update course status";
        setError(fallback);
      } finally {
        setPendingStatus(null);
      }
    });
  };

  const renderButton = (status: CourseApprovalStatus, opts?: { variant?: "outline" | "ghost"; className?: string }) => {
    const showLoader = isPending && pendingStatus === status;
    const isAlreadyStatus = currentStatus === status && status !== "PENDING";

    return (
      <Button
        size="sm"
        variant={opts?.variant ?? "outline"}
        className={opts?.className}
        disabled={showLoader || isAlreadyStatus}
        onClick={() => triggerUpdate(status)}
        type="button"
      >
        {showLoader ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {STATUS_LABEL[status]}
      </Button>
    );
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {renderButton("APPROVED")}
        {renderButton("CHANGES", { variant: "ghost", className: "text-orange-600" })}
      </div>
      {message ? <p className="text-xs text-emerald-600">{message}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
