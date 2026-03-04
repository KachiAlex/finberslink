import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listForumThreads } from "@/features/forum/service";
import { verifyToken } from "@/lib/auth/jwt";

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

export default async function TutorForumsPage() {
  const user = await getUserFromSession();
  if (!user || user.role !== "TUTOR") {
    redirect("/dashboard");
  }

  let threads: any[] = [];
  let error: unknown = null;

  try {
    threads = await listForumThreads({ limit: 30 });
  } catch (err) {
    console.error("Failed to load forums", err);
    error = err;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold text-slate-900">Forums</h1>
            <p className="text-slate-600">Course threads with latest replies.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/tutor">Back to dashboard</Link>
            </Button>
            <Button asChild>
              <Link href="/forum/new">Create thread</Link>
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Unable to load forums. Try reloading.
          </div>
        ) : null}

        <Card className="border border-slate-200/80 bg-white/95">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Recent threads</CardTitle>
            <CardDescription>Across all courses you can access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {threads.length === 0 ? (
              <p className="text-sm text-slate-500">No threads yet.</p>
            ) : (
              <div className="space-y-2">
                {threads.map((thread: any) => (
                  <div
                    key={thread.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{thread.title}</p>
                      <p className="text-xs text-slate-500">
                        {thread.course?.title ?? "Course"} · {thread._count?.posts ?? 0} posts
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{thread.author?.firstName} {thread.author?.lastName}</Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/forum/thread/${thread.id}`}>Open</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
