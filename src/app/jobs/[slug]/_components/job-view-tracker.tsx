"use client";

import { useEffect, useRef } from "react";

interface JobViewTrackerProps {
  jobId: string;
}

export function JobViewTracker({ jobId }: JobViewTrackerProps) {
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (!jobId || hasTrackedRef.current) {
      return;
    }

    hasTrackedRef.current = true;

    const controller = new AbortController();

    fetch(`/api/jobs/view/${jobId}`, {
      method: "POST",
      signal: controller.signal,
    }).catch(() => {
      // Non-blocking: tracking failure shouldn't break UI
    });

    return () => {
      controller.abort();
    };
  }, [jobId]);

  return null;
}
