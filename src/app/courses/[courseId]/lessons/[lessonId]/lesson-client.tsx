"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, PlayCircle, ReplyIcon, Share2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LessonProgressIndicator } from "@/features/progress/components/progress-components";
import { 
  useLessonProgress, 
  useVideoProgress, 
  useScrollProgress 
} from "@/features/progress/hooks/use-progress-tracking";

interface LessonPageClientProps {
  course: {
    id: string;
    title: string;
    slug: string;
  };
  lesson: {
    id: string;
    title: string;
    slug: string;
    durationMinutes: number;
    format: string;
    summary: string;
    content?: string;
    videoUrl?: string;
    status: string;
  };
  nextLesson?: {
    id: string;
    slug: string;
  } | null;
}

export default function LessonPageClient({
  course,
  lesson,
  nextLesson,
}: LessonPageClientProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const {
    progress,
    isLoading,
    isTracking,
    startTracking,
    stopTracking,
    completeLesson,
    trackEngagement,
  } = useLessonProgress(course.id, lesson.id);
  
  const { videoRef, isPlaying, setVideoRef } = useVideoProgress(course.id, lesson.id);
  const scrollProgress = useScrollProgress(course.id, lesson.id);

  // Initialize tracking when component mounts
  useEffect(() => {
    if (!isLoading && progress) {
      if (progress.status === "NOT_STARTED" && !hasStarted) {
        setHasStarted(true);
        startTracking();
      } else if (progress.status === "COMPLETED") {
        setIsCompleted(true);
      }
    }
  }, [progress, isLoading, hasStarted, startTracking]);

  // Track scroll engagement
  useEffect(() => {
    const handleClick = () => trackEngagement("click");
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [trackEngagement]);

  const handleCompleteLesson = async () => {
    await completeLesson();
    setIsCompleted(true);
  };

  const handleStartLesson = () => {
    if (!hasStarted) {
      setHasStarted(true);
      startTracking();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-[hsl(215,60%,92%)]">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <Link href="/courses" className="text-primary hover:underline">
              Courses
            </Link>
            <span>/</span>
            <Link href={`/courses/${course.id}`} className="text-primary hover:underline">
              {course.title}
            </Link>
            <span>/</span>
            <span className="text-slate-700">{lesson.title}</span>
          </div>
          
          {progress && (
            <LessonProgressIndicator
              status={progress.status}
              progress={progress.videoProgress || 0}
              timeSpent={progress.timeSpentMinutes || 0}
              score={progress.completionScore}
            />
          )}
        </div>

        {/* Lesson Content */}
        <div className="grid gap-8 lg:grid-cols-[1fr,400px]">
          {/* Main Content */}
          <div className="space-y-8">
            {/* Video Section */}
            {lesson.videoUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5" />
                    Video Lesson
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={setVideoRef}
                      className="w-full h-full"
                      controls
                      onPlay={handleStartLesson}
                      src={lesson.videoUrl}
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Duration: {lesson.durationMinutes} minutes
                    </div>
                    <div className="flex items-center gap-2">
                      {isPlaying && (
                        <Badge variant="outline" className="text-green-600">
                          Playing
                        </Badge>
                      )}
                      {isTracking && (
                        <Badge variant="outline" className="text-blue-600">
                          Tracking Progress
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Text Content */}
            {lesson.content && (
              <Card>
                <CardHeader>
                  <CardTitle>Lesson Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ __html: lesson.content }}
                    onClick={handleStartLesson}
                  />
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-3">
                    {!isCompleted ? (
                      <Button onClick={handleCompleteLesson} size="lg">
                        Mark as Complete
                      </Button>
                    ) : (
                      <Button variant="outline" size="lg" disabled>
                        ✓ Completed
                      </Button>
                    )}
                    
                    <Button asChild variant="outline">
                      <Link href={`/courses/${course.id}/chat?lessonId=${lesson.id}`}>
                        <MessageCircle className="h-4 w-4" /> Join Discussion
                      </Link>
                    </Button>
                  </div>
                  
                  {nextLesson && (
                    <Button asChild variant="outline">
                      <Link href={`/courses/${course.id}/lessons/${nextLesson.slug}`}>
                        Next Lesson →
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Your Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {progress ? (
                  <>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round((progress.videoProgress || 0) * 100)}%
                      </div>
                      <div className="text-sm text-slate-600">Video Progress</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {Math.floor((progress.timeSpentMinutes || 0) / 60)}h {(progress.timeSpentMinutes || 0) % 60}m
                      </div>
                      <div className="text-sm text-slate-600">Time Spent</div>
                    </div>
                    
                    {scrollProgress > 0 && (
                      <div className="text-center">
                        <div className="text-lg font-semibold">
                          {Math.round(scrollProgress * 100)}%
                        </div>
                        <div className="text-sm text-slate-600">Content Read</div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-slate-500">
                    Start the lesson to track your progress
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lesson Info */}
            <Card>
              <CardHeader>
                <CardTitle>Lesson Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-slate-900">Format</div>
                  <div className="text-slate-600 capitalize">{lesson.format}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-slate-900">Duration</div>
                  <div className="text-slate-600">{lesson.durationMinutes} minutes</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-slate-900">Status</div>
                  <Badge 
                    variant={lesson.status === "completed" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {lesson.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/courses/${course.id}`}>
                    ← Back to Course
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/courses/${course.id}/chat`}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Course Chat
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Lesson
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
