import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listForumThreads } from "@/features/forum/service";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ForumPage() {
  const threads = await listForumThreads();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Forum</h1>
            <p className="text-slate-600">Ask questions, share insights, and connect with peers.</p>
          </div>
          <Button asChild>
            <Link href="/forum/new">New thread</Link>
          </Button>
        </header>

        {threads.length === 0 ? (
          <Card className="border border-slate-200/70 bg-white/95">
            <CardContent className="py-12 text-center">
              <p className="text-sm text-slate-500">No threads yet. Start the first discussion!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {threads.map((thread) => (
              <Card key={thread.id} className="border border-slate-200/70 bg-white/95">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-slate-900">{thread.title}</CardTitle>
                    <Badge variant="outline">{thread._count.posts} posts</Badge>
                  </div>
                  <CardDescription>
                    By {thread.author.firstName} {thread.author.lastName} ·{" "}
                    {thread.course.title} · {thread.createdAt.toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {thread.posts.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-slate-600 line-clamp-2">{thread.posts[0].content}</p>
                    </div>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/forum/${thread.id}`}>View thread</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
