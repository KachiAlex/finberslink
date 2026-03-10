import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getForumThreadById, createForumPost } from "@/features/forum/service";
import { getSessionFromCookies, requireSession } from "@/lib/auth/session";
import ReplyForm from "./_components/reply-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function replyAction(formData: FormData) {
  "use server";

  const session = await requireSession({ failureMode: "error" });

  const threadId = String(formData.get("threadId") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const mentionsField = String(formData.get("mentions") ?? "").trim();

  if (!threadId || !content) return;

  const mentions =
    mentionsField.length > 0
      ? mentionsField.split(",").map((m) => m.trim()).filter(Boolean)
      : Array.from(
          new Set(
            [...content.matchAll(/@([\w-]+)/g)]
              .map((m) => m[1])
              .filter(Boolean)
          )
        );

  await createForumPost({
    content,
    threadId,
    authorId: session.sub,
    mentions,
  });

  revalidatePath(`/forum/${threadId}`);
}

export default async function ForumThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const thread = await getForumThreadById(id);
  if (!thread) {
    notFound();
  }

  const session = await getSessionFromCookies();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <Card className="border border-slate-200/70 bg-white/95">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold text-slate-900">{(thread as any).title}</CardTitle>
              <Badge variant="outline">{(thread as any).course.title}</Badge>
            </div>
            <CardDescription>
              By {(thread as any).author.firstName} {(thread as any).author.lastName} ·{" "}
              {(thread as any).createdAt.toLocaleDateString()}
            </CardDescription>
            {(thread as any).mentions?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {(thread as any).mentions.map((m: any) => (
                  <Badge key={m.user.id} variant="secondary" className="bg-indigo-50 text-indigo-700">
                    @{m.user.email?.split("@")?.[0] ?? m.user.firstName}
                  </Badge>
                ))}
              </div>
            ) : null}
          </CardHeader>
        </Card>

        <div className="space-y-6">
          {(thread as any).posts.map((post: any) => (
            <Card key={post.id} className="border border-slate-200/70 bg-white/95">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                      {post.author.firstName[0]}{post.author.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {post.author.firstName} {post.author.lastName}
                      </p>
                      <p className="text-xs text-slate-500">{post.createdAt.toLocaleDateString()}</p>
                    </div>
                  </div>
                  {post.lesson && (
                    <Badge variant="secondary" className="text-xs">
                      {post.lesson.title}
                    </Badge>
                  )}
                </div>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 leading-relaxed">{post.content}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {session && (
          <ReplyForm
            threadId={(thread as any).id}
            courseId={(thread as any).course?.id}
            action={replyAction}
          />
        )}
      </div>
    </main>
  );
}
