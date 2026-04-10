"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Hash, MessageCircle, MessagesSquare, Send, Video } from "lucide-react";

import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { UserAvatar } from "@/features/chat/components/user-avatar";
import { useChatMessages, useChatThreads, useSendChatMessage } from "@/features/chat/hooks";
import useSocket from "@/hooks/useSocket";
import { useQueryClient } from "@tanstack/react-query";

type CourseChatThread = {
  id: string;
  title: string | null;
  type: string;
  lessonId: string | null;
  createdAt: string;
  updatedAt?: string;
  lastMessageAt?: string | null;
  lesson?: { id: string; title: string } | null;
  createdBy?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  } | null;
  messages?: Array<{
    id: string;
    content: string;
    sentAt?: string;
    author?: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
    } | null;
  }>;
  _count?: { messages: number };
};

type CourseChatMessage = {
  id: string;
  content: string;
  sentAt?: string;
  authorId: string;
  author?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  } | null;
};

interface CourseChatContentProps {
  chatSpaceId: string;
  currentUserId: string;
  courseTitle: string;
  initialThreads: CourseChatThread[];
  initialSelectedThreadId: string;
}

function formatThreadLabel(thread: CourseChatThread) {
  if (thread.type === "LESSON") {
    return thread.lesson?.title ?? thread.title ?? "Lesson chat";
  }

  if (thread.type === "ANNOUNCEMENT") {
    return thread.title ?? "Announcements";
  }

  return thread.title ?? "General";
}

function formatThreadType(thread: CourseChatThread) {
  if (thread.type === "LESSON") return "Lesson";
  if (thread.type === "ANNOUNCEMENT") return "Announcements";
  return "Course";
}

function formatMessageTime(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function CourseChatInner({
  chatSpaceId,
  currentUserId,
  courseTitle,
  initialThreads,
  initialSelectedThreadId,
}: CourseChatContentProps) {
  const [selectedThreadId, setSelectedThreadId] = useState(initialSelectedThreadId);
  const [draft, setDraft] = useState("");

  const { data: liveThreads } = useChatThreads(chatSpaceId);
  const threads = (liveThreads as CourseChatThread[] | undefined) ?? initialThreads;
  const selectedThread = threads.find((thread) => thread.id === selectedThreadId) ?? threads[0] ?? null;

  const { data: liveMessages = [], isLoading: loadingMessages } = useChatMessages(selectedThread?.id ?? null);
  const { mutateAsync: sendMessage, isPending: isSending } = useSendChatMessage();
  const queryClient = useQueryClient();

  const socket = useSocket({ token: (() => {
    if (typeof document === 'undefined') return undefined;
    const m = document.cookie.match(/access_token=([^;\s]+)/);
    return m ? decodeURIComponent(m[1]) : undefined;
  })() });
  const prevThreadRef = useRef<string | null>(null);

  useEffect(() => {
    const handler = (data: any) => {
      if (!data || data.type !== 'message') return;
      const threadId = data.threadId;
      const message = data.payload;
      // Update react-query cache for the thread messages
      queryClient.setQueryData(["chat", "messages", threadId], (old: any) => {
        const arr = (old as any[]) || [];
        // Avoid duplicate if message id already present
        if (arr.some((m: any) => m.id === message.id)) return arr;
        return [message, ...arr];
      });
    };
    const unsub = socket.onMessage(handler);
    return unsub;
  }, [socket, queryClient]);

  useEffect(() => {
    const cur = selectedThread?.id ?? null;
    const prev = prevThreadRef.current;
    if (prev && prev !== cur) {
      socket.leave(prev);
    }
    if (cur) {
      socket.join(cur);
    }
    prevThreadRef.current = cur;
  }, [selectedThread?.id, socket]);

  const messages = useMemo(() => {
    const source = (liveMessages as CourseChatMessage[]).length
      ? (liveMessages as CourseChatMessage[])
      : ((selectedThread?.messages ?? []) as CourseChatMessage[]);

    return [...source].reverse();
  }, [liveMessages, selectedThread]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || !selectedThread) return;

    try {
      // Prefer WS send when connected
      if (socket.connected) {
        socket.sendMessage(selectedThread.id, { content });
        setDraft("");
      } else {
        await sendMessage({ threadId: selectedThread.id, content });
        setDraft("");
      }
    } catch (error) {
      console.error("Failed to send course chat message", error);
    }
  };

  return (
    <div className="grid min-h-[72vh] gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="border-slate-200/80 bg-white/95 shadow-sm">
        <CardContent className="flex h-full flex-col p-0">
          <div className="border-b border-slate-200 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Course chat</p>
            <h1 className="mt-2 flex items-center gap-2 text-xl font-semibold text-slate-900">
              <MessagesSquare className="h-5 w-5 text-sky-600" />
              {courseTitle}
            </h1>
            <p className="mt-1 text-sm text-slate-500">Join the cohort conversation without leaving your course flow.</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-2 p-3">
              {threads.map((thread) => {
                const active = thread.id === selectedThread?.id;
                const lastPreview = thread.messages?.[0]?.content ?? "No messages yet";

                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      active
                        ? "border-sky-200 bg-sky-50 shadow-sm"
                        : "border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-slate-400" />
                          <p className="truncate text-sm font-semibold text-slate-900">{formatThreadLabel(thread)}</p>
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs text-slate-500">{lastPreview}</p>
                      </div>
                      <Badge variant="outline" className="border-slate-200 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                        {formatThreadType(thread)}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 bg-white/95 shadow-sm">
        <CardContent className="flex h-full flex-col p-0">
          {selectedThread ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{formatThreadType(selectedThread)}</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">{formatThreadLabel(selectedThread)}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="rounded-full border-slate-200 text-slate-500">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full border-slate-200 text-slate-500">
                    <Video className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.08),_transparent_45%),linear-gradient(to_bottom,_white,_rgb(248_250_252))] px-5 py-5">
                <div className="space-y-4">
                  {loadingMessages ? (
                    <p className="text-sm text-slate-500">Loading messages...</p>
                  ) : messages.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 px-6 py-10 text-center">
                      <p className="text-sm font-medium text-slate-700">This thread is ready for the first message.</p>
                      <p className="mt-2 text-sm text-slate-500">Ask a question, share insight, or continue the lesson discussion here.</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isCurrentUser = message.authorId === currentUserId;
                      const authorName = message.author
                        ? `${message.author.firstName ?? ""} ${message.author.lastName ?? ""}`.trim() || "Course member"
                        : "Course member";

                      return (
                        <div
                          key={message.id}
                          className={`flex items-end gap-3 ${isCurrentUser ? "justify-end" : "justify-start"}`}
                        >
                          {!isCurrentUser ? (
                            <UserAvatar
                              avatarUrl={message.author?.avatarUrl ?? null}
                              firstName={message.author?.firstName ?? undefined}
                              lastName={message.author?.lastName ?? undefined}
                              size="sm"
                            />
                          ) : null}

                          <div className={`max-w-[78%] ${isCurrentUser ? "items-end" : "items-start"}`}>
                            <div
                              className={`rounded-3xl px-4 py-3 text-sm shadow-sm ${
                                isCurrentUser
                                  ? "bg-sky-600 text-white"
                                  : "bg-white text-slate-800 ring-1 ring-slate-200"
                              }`}
                            >
                              {!isCurrentUser ? <p className="mb-1 text-xs font-semibold text-slate-500">{authorName}</p> : null}
                              <p className="whitespace-pre-wrap">{message.content}</p>
                            </div>
                            <p className={`mt-1 text-xs text-slate-400 ${isCurrentUser ? "text-right" : "text-left"}`}>
                              {formatMessageTime(message.sentAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 px-5 py-4">
                <div className="flex gap-3">
                  <Input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void handleSend();
                      }
                    }}
                    placeholder={`Message ${formatThreadLabel(selectedThread)}`}
                    disabled={isSending}
                    className="h-12 rounded-full border-slate-200 px-5"
                  />
                  <Button onClick={() => void handleSend()} disabled={isSending || !draft.trim()} className="h-12 rounded-full px-5">
                    <Send className="mr-2 h-4 w-4" />
                    Send
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-slate-500">
              No course threads are available yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function CourseChatContent(props: CourseChatContentProps) {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <CourseChatInner {...props} />
    </QueryClientProvider>
  );
}