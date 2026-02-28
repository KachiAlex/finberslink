import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, PlayCircle, ReplyIcon, Share2 } from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLearnerLesson } from "@/features/lms/data/course-service";

const forumPreview = [
  {
    id: "thread-1",
    author: "Amina Yusuf",
    timeAgo: "2h",
    excerpt:
      "Loved the discovery canvas! Does anyone have tips for turning our interview notes into insight statements?",
  },
  {
    id: "thread-2",
    author: "Leo Martinez",
    timeAgo: "5h",
    excerpt: "Sharing my sprint retrospective template—open to feedback before the live review session tomorrow!",
  },
];

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const result = await getLearnerLesson(courseId, lessonId);
  if (!result) {
    notFound();
  }

  const { course, lesson } = result;
  const nextLesson = course.lessons.find((item) => item.status === "available" && item.id !== lesson.id);
  const lessonVideoUrl = lesson.videoUrl ?? "https://www.youtube.com/embed/ysz5S6PUM-U";

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-[hsl(215,60%,92%)]">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
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
          <Badge variant="outline" className="border-primary/30 text-primary">
            {lesson.status === "completed" && "Completed"}
            {lesson.status === "available" && "Available now"}
            {lesson.status === "locked" && "Locked"}
          </Badge>
        </div>

        <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <Card className="overflow-hidden border border-white/70 bg-white shadow-lg">
            <div className="relative aspect-video w-full">
              <iframe
                src={lessonVideoUrl}
                title={lesson.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-500">
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <PlayCircle className="h-4 w-4" /> {lesson.durationMinutes} mins
                </span>
                <span>Format: {lesson.format}</span>
              </div>
              <h1 className="text-3xl font-semibold text-slate-900">{lesson.title}</h1>
              <p className="text-slate-600">{lesson.summary}</p>
              {lesson.content && <p className="text-sm text-slate-500">{lesson.content}</p>}
              <div className="flex flex-wrap gap-3">
                <Button className="gap-2">
                  <MessageCircle className="h-4 w-4" /> Join live chat
                </Button>
                {nextLesson && (
                  <Button asChild variant="outline">
                    <Link href={`/courses/${course.id}/lessons/${nextLesson.id}`}>Go to next lesson</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border border-slate-200/80 bg-white/95">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-[0.3em] text-primary">Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {lesson.resources.map((resource) => (
                  <div key={resource.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{resource.title}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>{resource.type.toUpperCase()}</span>
                      <Link href={resource.url} className="text-primary hover:underline" target="_blank">
                        Open resource
                      </Link>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border border-slate-200/80 bg-white/95">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-[0.3em] text-primary">Forum preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {forumPreview.map((thread) => (
                  <div key={thread.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{thread.author}</span>
                      <span>{thread.timeAgo}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{thread.excerpt}</p>
                    <div className="mt-3 flex gap-3 text-xs text-slate-500">
                      <button className="inline-flex items-center gap-1">
                        <ReplyIcon className="h-3.5 w-3.5" /> Reply
                      </button>
                      <button className="inline-flex items-center gap-1">
                        <Share2 className="h-3.5 w-3.5" /> Share
                      </button>
                    </div>
                  </div>
                ))}
                <Button asChild variant="ghost" className="w-full text-primary">
                  <Link href="/forum">Open community space</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
