"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare } from "lucide-react";

type Thread = {
  id: string;
  title: string;
  course?: { title?: string };
  _count?: { posts?: number };
  unread?: boolean;
  mentions?: boolean;
};

type ThreadFilter = "all" | "unread" | "mentions";

type UnreadCountResponse = { count?: number } | null;
type ThreadsResponse = { threads?: Thread[] } | null;

const getErrorMessage = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

export default function TutorMessagesPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<ThreadFilter>("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [unreadRes, threadsRes] = await Promise.all([
          fetch("/api/notifications/unread-count"),
          fetch("/api/tutor/forum-threads"),
        ]);
        if (unreadRes.ok) {
          const data = (await unreadRes.json()) as UnreadCountResponse;
          setUnreadCount(data?.count ?? 0);
        }
        if (threadsRes.ok) {
          const data = (await threadsRes.json()) as ThreadsResponse;
          setThreads(data?.threads ?? []);
        }
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load messages"));
      }
    };
    fetchData();
  }, []);

  const handleOpen = async (threadId: string) => {
    try {
      await fetch(`/api/tutor/forum-threads/${threadId}/read`, { method: "POST" });
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, unread: false } : t))
      );
    } catch (_err) {
      // ignore read marking failure
    } finally {
      router.push(`/forum/thread/${threadId}`);
    }
  };

  const filteredThreads = useMemo(() => {
    const q = query.trim().toLowerCase();
    return threads.filter((t) => {
      const matchesQuery =
        !q || t.title.toLowerCase().includes(q) || (t.course?.title ?? "").toLowerCase().includes(q);
      if (!matchesQuery) return false;
      if (filter === "mentions") {
        return !!t.mentions;
      }
      if (filter === "unread") {
        return !!t.unread;
      }
      return true;
    });
  }, [threads, query, filter]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold text-slate-900">Messages & forums</h1>
            <p className="text-slate-600">Filter threads, mentions, and unread conversations.</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/tutor">Back to dashboard</Link>
          </Button>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Unable to load messages. Try reloading.
          </div>
        ) : null}

        <Card className="border border-slate-200/80 bg-white/95">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Inbox</CardTitle>
              <CardDescription>Threads ordered by recent activity.</CardDescription>
            </div>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              {unreadCount} unread
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Tabs value={filter} onValueChange={(v) => setFilter(v as ThreadFilter)} className="w-full sm:w-auto">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">Unread</TabsTrigger>
                  <TabsTrigger value="mentions">Mentions</TabsTrigger>
                </TabsList>
              </Tabs>
              <Input
                placeholder="Search threads"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full sm:w-64"
              />
            </div>

            {filteredThreads.length === 0 ? (
              <p className="text-sm text-slate-500">No threads match this filter.</p>
            ) : (
              <div className="space-y-2">
                {filteredThreads.map((thread) => (
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
                    <Button variant="ghost" size="sm" onClick={() => handleOpen(thread.id)}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Open
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button variant="outline" asChild>
            <Link href="/forum">View all forums</Link>
          </Button>
          <Button asChild>
            <Link href="/forum/new">Create forum thread</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
