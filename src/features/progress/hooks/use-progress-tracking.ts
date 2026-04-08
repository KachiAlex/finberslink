import { useState, useCallback, useEffect } from "react";
import useSWR, { useSWRConfig } from "swr";

export interface LessonProgressData {
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  watchTimeSeconds: number;
  timeSpentMinutes: number;
  videoProgress: number;
  scrollProgress: number;
  lastAccessedAt: string;
  engagementMetrics: {
    clicks?: number;
    scrolls?: number;
    pauses?: number;
    seeks?: number;
    resourceDownloads?: number;
  };
}

export interface CourseProgressData {
  course: {
    id: string;
    title: string;
    totalLessons: number;
  };
  enrollment: {
    id: string;
    progressPercentage: number;
    status: string;
    streakDays: number;
    totalStudyTime: number;
    lastAccessedAt: string | null;
  };
  progress: {
    completedLessons: number;
    inProgressLessons: number;
    notStartedLessons: number;
    totalWatchTime: number;
    averageTimePerLesson: number;
    progressVelocity: number;
    estimatedWeeksToComplete: number | null;
  };
  engagement: {
    totalClicks: number;
    totalScrolls: number;
    totalPauses: number;
    totalSeeks: number;
    totalDownloads: number;
    score: number;
  };
  lessons: Array<{
    id: string;
    title: string;
    order: number;
    durationMinutes: number;
    format: string;
    status: string;
    progress: number;
    watchTime: number;
    timeSpent: number;
    completedAt: string | null;
    lastAccessedAt: string | null;
    score: number | null;
  }>;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    points: number;
    unlockedAt: string;
    progress: number;
  }>;
}

/**
 * Hook for tracking lesson progress in real-time
 */
export function useLessonProgress(courseId: string, lessonId: string) {
  const [isTracking, setIsTracking] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [videoWatchTime, setVideoWatchTime] = useState(0);
  const [lastSaveTime, setLastSaveTime] = useState(Date.now());
  const { mutate } = useSWRConfig();

  // Load initial progress
  const { data: progress, isLoading } = useSWR<LessonProgressData>(
    `/api/courses/${courseId}/lessons/${lessonId}/progress`,
    async (url) => {
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) {
        // Try fallback API if main API fails
        console.log("Main lesson progress API failed, returning mock data...");
        return {
          status: "NOT_STARTED",
          watchTimeSeconds: 0,
          timeSpentMinutes: 0,
          videoProgress: 0,
          scrollProgress: 0,
          lastAccessedAt: new Date().toISOString(),
          engagementMetrics: {
            clicks: 0,
            scrolls: 0,
            pauses: 0,
            seeks: 0,
            resourceDownloads: 0,
          },
        };
      }
      const result = await response.json();
      return result.data;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      onError: (error) => {
        console.error("Lesson progress error:", error);
      },
    }
  );

  // Auto-save progress every 30 seconds
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastSaveTime >= 30000) { // 30 seconds
        saveProgress();
        setLastSaveTime(now);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isTracking, lastSaveTime]);

  const startTracking = useCallback(() => {
    setIsTracking(true);
    setSessionStartTime(new Date());
    setLastSaveTime(Date.now());
  }, []);

  const stopTracking = useCallback(() => {
    if (isTracking) {
      saveProgress();
      setIsTracking(false);
      setSessionStartTime(null);
    }
  }, [isTracking]);

  const saveProgress = useCallback(async () => {
    if (!sessionStartTime) return;

    const timeSpentMinutes = Math.floor(
      (Date.now() - sessionStartTime.getTime()) / (1000 * 60)
    );

    try {
      await fetch(`/api/courses/${courseId}/lessons/${lessonId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: "IN_PROGRESS",
          timeSpentMinutes,
          watchTimeSeconds: videoWatchTime,
          videoProgress: progress?.videoProgress || 0,
          scrollProgress: progress?.scrollProgress || 0,
        }),
      });

      // Invalidate cache to get updated data
      mutate(`/api/courses/${courseId}/lessons/${lessonId}/progress`);
      mutate(`/api/courses/${courseId}/progress`);
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
  }, [sessionStartTime, videoWatchTime, progress, courseId, lessonId, mutate]);

  const updateVideoProgress = useCallback((progress: number) => {
    setVideoWatchTime(prev => prev + 1);
    
    // Auto-update video progress
    fetch(`/api/courses/${courseId}/lessons/${lessonId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        status: progress >= 0.8 ? "COMPLETED" : "IN_PROGRESS",
        watchTimeSeconds: 1,
        videoProgress: progress,
      }),
    }).catch(console.error);
  }, [courseId, lessonId]);

  const completeLesson = useCallback(async (score?: number) => {
    try {
      await fetch(`/api/courses/${courseId}/lessons/${lessonId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: "COMPLETED",
          completionScore: score,
          timeSpentMinutes: sessionStartTime
            ? Math.floor((Date.now() - sessionStartTime.getTime()) / (1000 * 60))
            : 0,
        }),
      });

      // Invalidate caches
      mutate(`/api/courses/${courseId}/lessons/${lessonId}/progress`);
      mutate(`/api/courses/${courseId}/progress`);
      
      stopTracking();
    } catch (error) {
      console.error("Failed to complete lesson:", error);
    }
  }, [courseId, lessonId, sessionStartTime, mutate, stopTracking]);

  const trackEngagement = useCallback((type: "click" | "scroll" | "pause" | "seek" | "download") => {
    const metrics: Record<string, number> = {};
    metrics[`${type}s`] = 1;

    fetch(`/api/courses/${courseId}/lessons/${lessonId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        engagementMetrics: metrics,
      }),
    }).catch(console.error);
  }, [courseId, lessonId]);

  return {
    progress,
    isLoading,
    isTracking,
    startTracking,
    stopTracking,
    saveProgress,
    updateVideoProgress,
    completeLesson,
    trackEngagement,
  };
}

/**
 * Hook for comprehensive course progress
 */
export function useCourseProgress(courseId: string) {
  const { data: courseProgress, isLoading, error } = useSWR<CourseProgressData>(
    `/api/courses/${courseId}/progress`,
    async (url) => {
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) {
        // Try fallback API if main API fails
        console.log("Main progress API failed, trying fallback...");
        const fallbackResponse = await fetch(`/api/courses/${courseId}/progress-fallback`, { 
          credentials: "include" 
        });
        if (!fallbackResponse.ok) {
          throw new Error("Failed to fetch course progress from both APIs");
        }
        const fallbackResult = await fallbackResponse.json();
        return fallbackResult;
      }
      const result = await response.json();
      return result.data || result; // Handle both data formats
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      onError: (error) => {
        console.error("Course progress error:", error);
        // SWR will retry automatically
      },
    }
  );

  return {
    courseProgress,
    isLoading,
    error,
  };
}

/**
 * Hook for video progress tracking
 */
export function useVideoProgress(courseId: string, lessonId: string) {
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { updateVideoProgress, trackEngagement } = useLessonProgress(courseId, lessonId);

  useEffect(() => {
    if (!videoRef) return;

    const video = videoRef;
    let progressInterval: NodeJS.Timeout;

    const handlePlay = () => {
      setIsPlaying(true);
      trackEngagement("play");
      
      // Track progress every 5 seconds
      progressInterval = setInterval(() => {
        if (video.duration) {
          const progress = video.currentTime / video.duration;
          updateVideoProgress(progress);
        }
      }, 5000);
    };

    const handlePause = () => {
      setIsPlaying(false);
      trackEngagement("pause");
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };

    const handleSeeked = () => {
      trackEngagement("seek");
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      updateVideoProgress(1); // Mark as fully watched
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("ended", handleEnded);
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [videoRef, updateVideoProgress, trackEngagement]);

  return {
    videoRef,
    isPlaying,
    setVideoRef,
  };
}

/**
 * Hook for scroll progress tracking
 */
export function useScrollProgress(courseId: string, lessonId: string) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const { trackEngagement } = useLessonProgress(courseId, lessonId);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(scrollTop / docHeight, 1);
      
      setScrollProgress(progress);
      
      // Track scroll engagement
      if (Math.random() < 0.1) { // Sample 10% of scrolls to avoid too many requests
        trackEngagement("scroll");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [trackEngagement]);

  return scrollProgress;
}
