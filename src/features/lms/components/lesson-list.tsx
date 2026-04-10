import Link from "next/link";
import { Clock, Lock, PlayCircle, Radio } from "lucide-react";

import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { UniversalVideo } from "../../../components/ui/universal-video";
import { PDFViewer } from "../../../components/ui/pdf-viewer";
import type { Lesson } from "@/types/lms";

interface LessonListProps {
  courseId: string;
  lessons: Lesson[];
}

const formatCopy: Record<Lesson["format"], string> = {
  video: "Video",
  live: "Live",
  text: "Reading",
  project: "Project",
};

export function LessonList({ courseId, lessons }: LessonListProps) {
  return (
    <div className="space-y-6">
      {lessons.map((lesson, index) => {
        const Icon = lesson.format === "live" ? Radio : PlayCircle;
        const locked = lesson.status === "locked";
        
        return (
          <div key={lesson.id} className="space-y-4">
            {/* Lesson Card */}
            <Card
              className="flex items-center justify-between gap-4 border border-slate-200/80 bg-white/95 p-4"
            >
              <div className="flex flex-1 items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Lesson {index + 1}</p>
                  <p className="text-base font-semibold text-slate-900">{lesson.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {lesson.durationMinutes} mins
                    </span>
                    <Badge variant="secondary" className="border-0 bg-slate-100 text-slate-700">
                      {formatCopy[lesson.format]}
                    </Badge>
                    <span className="text-xs text-slate-400 line-clamp-1 max-w-[320px]">
                      {lesson.summary}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 text-xs text-slate-500">
                <span className="text-slate-500">
                  {lesson.status === "completed" && "Completed"}
                  {lesson.status === "available" && "Available"}
                  {lesson.status === "locked" && "Locked"}
                </span>
                {locked ? (
                  <Button size="sm" variant="outline" disabled className="inline-flex items-center gap-1 text-slate-500">
                    <Lock className="h-3.5 w-3.5" /> Locked
                  </Button>
                ) : (
                  <Button asChild size="sm">
                    <Link href={`/courses/${courseId}/lessons/${lesson.id}`}>Start lesson</Link>
                  </Button>
                )}
              </div>
            </Card>

            {/* Lesson Content - Video and Resources */}
            {lesson.status === "available" && (
              <Card className="border border-slate-200/80 bg-white/95 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Lesson Content</h3>
                
                {/* Video Content */}
                {lesson.videoUrl && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-slate-800 mb-3">Video Lesson</h4>
                    <UniversalVideo
                      url={lesson.videoUrl}
                      width={100}
                      height={400}
                      controls={true}
                      className="w-full"
                    />
                  </div>
                )}

                {/* PDF Resources */}
                {lesson.resources && lesson.resources.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-slate-800 mb-3">Lesson Resources</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      {lesson.resources.map((resource) => (
                        <div key={resource.id} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-slate-700 capitalize">{resource.type}</span>
                            <Badge variant="outline" className="text-xs">
                              {resource.type}
                            </Badge>
                          </div>
                          
                          {resource.type.toLowerCase() === 'pdf' ? (
                            <PDFViewer
                              url={resource.url}
                              title={resource.title}
                              width={100}
                              height={300}
                            />
                          ) : (
                            <div className="text-center">
                              <Button asChild variant="outline" size="sm">
                                <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                  Open {resource.type}
                                </a>
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>
        );
      })}
    </div>
  );
}
