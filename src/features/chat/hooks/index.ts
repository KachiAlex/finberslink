import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

const ChatSpaceSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "COURSE"]),
  courseId: z.string().nullable(),
  createdAt: z.string(),
});

const ChatThreadSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  type: z.enum(["CHANNEL", "LESSON", "ANNOUNCEMENT", "DM"]),
  lessonId: z.string().nullable(),
  createdAt: z.string(),
});

const ChatMessageSchema = z.object({
  id: z.string(),
  content: z.string(),
  authorId: z.string(),
  createdAt: z.string(),
  attachments: z.array(z.record(z.any())).optional(),
  parentId: z.string().nullable(),
  mentionUserIds: z.array(z.string()).optional(),
});

export type ChatSpace = z.infer<typeof ChatSpaceSchema>;
export type ChatThread = z.infer<typeof ChatThreadSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function poster<T, B>(url: string, body: B): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useChatSpaces() {
  return useQuery({
    queryKey: ["chat", "spaces"],
    queryFn: () => fetcher<{ spaces: ChatSpace[] }>("/api/chat/spaces"),
    select: (d) => d.spaces,
  });
}

export function useCreateChatSpace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { slug: string; title: string; courseId?: string; visibility?: string }) =>
      poster<{ space: ChatSpace }, typeof body>("/api/chat/spaces", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", "spaces"] }),
  });
}

export function useChatThreads(chatSpaceId: string | null) {
  return useQuery({
    queryKey: ["chat", "threads", chatSpaceId],
    queryFn: () =>
      fetcher<{ threads: ChatThread[] }>(`/api/chat/threads?chatSpaceId=${chatSpaceId}`),
    select: (d) => d.threads,
    enabled: !!chatSpaceId,
  });
}

export function useCreateChatThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { chatSpaceId: string; title?: string; type?: string; lessonId?: string }) =>
      poster<{ thread: ChatThread }, typeof body>("/api/chat/threads", body),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["chat", "threads", vars.chatSpaceId] }),
  });
}

export function useChatMessages(threadId: string | null) {
  return useQuery({
    queryKey: ["chat", "messages", threadId],
    queryFn: () => fetcher<{ messages: ChatMessage[] }>(`/api/chat/messages?threadId=${threadId}`),
    select: (d) => d.messages,
    enabled: !!threadId,
  });
}

export function useSendChatMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { threadId: string; content: string; attachments?: any[]; parentId?: string; mentionUserIds?: string[] }) =>
      poster<{ message: ChatMessage }, typeof body>("/api/chat/messages", body),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["chat", "messages", vars.threadId] }),
  });
}

export function useMarkThreadRead() {
  return useMutation({
    mutationFn: (body: { threadId: string; readAt?: string }) =>
      poster<{ ok: boolean }, typeof body>("/api/chat/read-receipts", body),
  });
}

export function useChatNotifications(includeSeen = false) {
  return useQuery({
    queryKey: ["chat", "notifications", includeSeen],
    queryFn: () =>
      fetcher<{ notifications: any[] }>(`/api/chat/notifications?includeSeen=${includeSeen}`),
    select: (d) => d.notifications,
  });
}

export function useMarkNotificationsSeen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notificationIds: string[]) =>
      poster<{ result: any }, { notificationIds: string[] }>("/api/chat/notifications", {
        notificationIds,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", "notifications"] }),
  });
}
