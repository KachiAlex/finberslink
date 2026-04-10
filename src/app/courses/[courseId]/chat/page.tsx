import Link from "next/link";
import { notFound } from "next/navigation";

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

  // Get session without strict requirements for course chat
  let session = null;
  let userId = "anonymous";

  try {
    // Try to get session from cookies directly
    const cookies = await import('next/headers').then(mod => mod.cookies());
    const token = cookies.get("access_token")?.value;

    if (token) {
      console.log("Found access token, verifying...");
      const { verifyToken } = await import("../../../../lib/auth/jwt");
      session = verifyToken(token);
      userId = session.sub;
      console.log("Session verified for user:", userId);
    } else {
      console.log("No access token found in cookies");
    }
  } catch (error) {
    console.log("Session verification failed:", error);
    // Continue with anonymous access
  }

  console.log("Course chat access attempt:", { courseId, lessonId, userId, hasSession: !!session });

  try {
    // Try to get course chat context
    const context = await ensureCourseChatContext({
      courseIdOrSlug: courseId,
      userId: userId,
      lessonIdOrSlug: lessonId ?? null,
    });

    if (!context) {
      console.log("Chat context not found, course might not exist or be archived");
      // Show course not found message
      return (
        <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-[hsl(215,60%,92%)]">
          <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-slate-900 mb-4">Course Not Found</h1>
              <p className="text-slate-600 mb-6">
                The course you're trying to access doesn't exist or has been archived.
              </p>
              <div className="space-y-4">
                <Button asChild>
                  <Link href="/courses">Browse Courses</Link>
                </Button>
                <div>
                  <Link href="/dashboard/courses" className="text-primary hover:underline">
                    View My Courses
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      );
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

    // If we have a valid session, show the full chat experience
    if (session) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-[hsl(215,60%,92%)]">
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

    // If no session, show a simplified chat interface that allows viewing
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-[hsl(215,60%,92%)]">
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
                Connect with your cohort and tutor in real-time.
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

          {/* Simplified Chat View for non-authenticated users */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Course Discussion</h2>
              <p className="text-slate-600">
                This is the live chat for <strong>{context.course.title}</strong>. 
                Sign in to participate in the conversation.
              </p>
            </div>
            
            {/* Show available threads */}
            <div className="space-y-4">
              <h3 className="font-medium text-slate-900">Available Discussions:</h3>
              {threads.length > 0 ? (
                <div className="grid gap-3">
                  {threads.map((thread) => (
                    <div key={thread.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-slate-900">{thread.title || "General Discussion"}</h4>
                          <p className="text-sm text-slate-500">
                            {thread.type === "LESSON" ? "Lesson-specific chat" : "Course-wide discussion"}
                          </p>
                          {thread._count?.messages && (
                            <p className="text-xs text-slate-400">
                              {thread._count.messages} message{thread._count.messages !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {thread.type === "LESSON" ? "Lesson" : thread.type === "ANNOUNCEMENT" ? "Announcements" : "General"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">No discussions available yet.</p>
              )}
            </div>

            <div className="mt-6 text-center">
              <Button asChild size="lg">
                <Link href="/login">Sign In to Join Chat</Link>
              </Button>
              <div className="mt-3">
                <Link href="/dashboard/courses" className="text-primary hover:underline text-sm">
                  View My Courses
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error("Course chat error:", error);
    
    // Fallback page for any errors
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-[hsl(215,60%,92%)]">
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-slate-900 mb-4">Chat Unavailable</h1>
            <p className="text-slate-600 mb-6">
              We're having trouble loading the chat for this course. Please try again later.
            </p>
            <div className="space-y-4">
              <Button asChild>
                <Link href={`/courses/${courseId}`}>Back to Course</Link>
              </Button>
              <div>
                <Link href="/dashboard/courses" className="text-primary hover:underline">
                  View My Courses
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
}