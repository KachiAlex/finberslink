import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ensureCourseChatContext } from "@/features/chat/service";
import { requireSession } from "@/lib/auth/session";

import { CourseChatContent } from "./course-chat-content";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CourseChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ lessonId?: string }>;
}) {
  const [{ courseId }, { lessonId }] = await Promise.all([params, searchParams]);
  const session = await requireSession({ allowedRoles: ["STUDENT"], failureMode: "redirect" });

  const context = await ensureCourseChatContext({
    courseIdOrSlug: courseId,
    userId: session.sub,
    lessonIdOrSlug: lessonId ?? null,
  });

  if (!context) {
    notFound();
  }

  const threads = context.threads.map((thread) => ({
    id: thread.id,
    title: thread.title,
    type: thread.type,
    lessonId: thread.lessonId,
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
    lastMessageAt: thread.lastMessageAt?.toISOString() ?? null,
    lesson: thread.lesson,
    createdBy: thread.createdBy,
    messages: thread.messages.map((message) => ({
      id: message.id,
      content: message.content,
      sentAt: message.sentAt.toISOString(),
      author: message.author,
    })),
    _count: thread._count,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-[hsl(215,60%,92%)]">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <Link href="/courses" className="text-primary hover:underline">
                Courses
              </Link>
              <span>/</span>
              <Link href={`/courses/${context.course.id}`} className="text-primary hover:underline">
                {context.course.title}
              </Link>
              <span>/</span>
              <span className="text-slate-700">Live Chat</span>
            </div>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">{context.course.title} live chat</h1>
            <p className="mt-2 text-slate-600">
              Stay inside the course flow while chatting with your cohort and tutor.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {context.lesson ? (
              <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                Focused on {context.lesson.title}
              </Badge>
            ) : null}
            <Button asChild variant="outline">
              <Link href={`/courses/${context.course.id}`}>Back to course</Link>
            </Button>
          </div>
        </div>

        <CourseChatContent
          chatSpaceId={context.chatSpace.id}
          currentUserId={session.sub}
          courseTitle={context.course.title}
          initialThreads={threads}
          initialSelectedThreadId={context.selectedThreadId}
        />
      </main>
    </div>
  );
}