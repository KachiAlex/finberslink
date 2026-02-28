import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getForumThreadById, createForumPost } from "@/features/forum/service";
import { verifyToken } from "@/lib/auth/jwt";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getUserFromSession() {
  const store = await cookies();
  const accessToken = store.get("access_token")?.value;
  if (!accessToken) return null;
  try {
    return verifyToken(accessToken);
  } catch {
    return null;
  }
}

async function replyAction(formData: FormData) {
  "use server";

  const user = await getUserFromSession();
  if (!user) return;

  const threadId = String(formData.get("threadId") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!threadId || !content) return;

  await createForumPost({
    content,
    threadId,
    authorId: user.sub,
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

  const user = await getUserFromSession();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <Card className="border border-slate-200/70 bg-white/95">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold text-slate-900">{thread.title}</CardTitle>
              <Badge variant="outline">{thread.course.title}</Badge>
            </div>
            <CardDescription>
              By {thread.author.firstName} {thread.author.lastName} ·{" "}
              {thread.createdAt.toLocaleDateString()}
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="space-y-6">
          {thread.posts.map((post) => (
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

        {user && (
          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Reply</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" action={replyAction}>
                <input type="hidden" name="threadId" value={thread.id} />
                <Textarea
                  name="content"
                  placeholder="Share your thoughts..."
                  rows={4}
                  required
                />
                <Button type="submit">Post reply</Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
