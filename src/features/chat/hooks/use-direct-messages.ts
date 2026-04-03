import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

// ============================================================================
// SCHEMAS
// ============================================================================

const UserPreviewSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  avatarUrl: z.string().nullable(),
});

const DirectMessageReadSchema = z.object({
  messageId: z.string(),
  userId: z.string(),
  readAt: z.string(),
});

const DirectMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderId: z.string(),
  content: z.string(),
  attachments: z.array(z.any()).default([]),
  mentions: z.array(z.any()).default([]),
  sentAt: z.string(),
  editedAt: z.string().nullable().optional(),
  deletedAt: z.string().nullable().optional(),
  sender: UserPreviewSchema,
  reads: z.array(DirectMessageReadSchema).default([]),
});

const DirectConversationParticipantSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  userId: z.string(),
  joinedAt: z.string(),
  leftAt: z.string().nullable().optional(),
  role: z.enum(["ADMIN", "MEMBER"]),
  user: UserPreviewSchema,
});

const DirectConversationSchema = z.object({
  id: z.string(),
  type: z.enum(["DIRECT", "GROUP"]),
  name: z.string().nullable(),
  groupIcon: z.string().nullable().optional(),
  createdById: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastMessageAt: z.string().nullable().optional(),
  archivedAt: z.string().nullable().optional(),
  participants: z.array(DirectConversationParticipantSchema),
  messages: z.array(DirectMessageSchema).default([]),
  createdBy: UserPreviewSchema,
  _count: z.object({ messages: z.number() }).optional(),
});

export type UserPreview = z.infer<typeof UserPreviewSchema>;
export type DirectMessage = z.infer<typeof DirectMessageSchema>;
export type DirectConversation = z.infer<typeof DirectConversationSchema>;

// ============================================================================
// HELPERS
// ============================================================================

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

// ============================================================================
// CONVERSATION HOOKS
// ============================================================================

export function useDirectConversations(options?: { limit?: number }) {
  return useQuery({
    queryKey: ["chat", "direct", "conversations"],
    queryFn: () => {
      const params = new URLSearchParams();
      if (options?.limit) params.append("limit", options.limit.toString());
      return fetcher<{ conversations: DirectConversation[] }>(
        `/api/chat/direct/conversations?${params.toString()}`
      );
    },
    select: (d) => d.conversations,
  });
}

export function useGetDirectConversation(conversationId: string | null) {
  return useQuery({
    queryKey: ["chat", "direct", "conversations", conversationId],
    queryFn: () =>
      fetcher<{ conversation: DirectConversation }>(
        `/api/chat/direct/conversations/${conversationId}`
      ),
    select: (d) => d.conversation,
    enabled: !!conversationId,
  });
}

export function useCreateDirectConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { type: "DIRECT" | "GROUP"; targetUserId?: string; name?: string; participantUserIds?: string[] }) =>
      poster<{ conversation: DirectConversation }, typeof body>(
        "/api/chat/direct/conversations",
        body
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat", "direct", "conversations"] });
    },
  });
}

// ============================================================================
// MESSAGE HOOKS
// ============================================================================

export function useConversationMessages(conversationId: string | null, options?: { limit?: number }) {
  return useQuery({
    queryKey: ["chat", "direct", "messages", conversationId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (options?.limit) params.append("limit", options.limit.toString());
      return fetcher<{ messages: DirectMessage[] }>(
        `/api/chat/direct/conversations/${conversationId}/messages?${params.toString()}`
      );
    },
    select: (d) => d.messages,
    enabled: !!conversationId,
  });
}

export function useSendDirectMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      body,
    }: {
      conversationId: string;
      body: { content: string; attachments?: any[]; mentions?: string[] };
    }) =>
      poster<{ message: DirectMessage }, typeof body>(
        `/api/chat/direct/conversations/${conversationId}/messages`,
        body
      ),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["chat", "direct", "messages", vars.conversationId] });
      qc.invalidateQueries({ queryKey: ["chat", "direct", "conversations"] });
    },
  });
}

export function useMarkMessageRead() {
  return useMutation({
    mutationFn: ({
      conversationId,
      messageId,
    }: {
      conversationId: string;
      messageId: string;
    }) =>
      poster<{ read: any }, {}>(
        `/api/chat/direct/conversations/${conversationId}/messages/${messageId}/read`,
        {}
      ),
  });
}

export function useMarkConversationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId }: { conversationId: string }) =>
      poster<{ result: any }, {}>(
        `/api/chat/direct/conversations/${conversationId}/read`,
        {}
      ),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["chat", "direct", "messages", vars.conversationId] });
    },
  });
}
