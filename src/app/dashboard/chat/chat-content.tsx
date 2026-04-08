"use client";

import { useState, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConversationSidebar } from "@/features/chat/components/conversation-sidebar";
import { ChatArea } from "@/features/chat/components/chat-area";
import { NewConversationModal } from "@/features/chat/components/new-conversation-modal";
import {
  useDirectConversations,
  useConversationMessages,
  useSendDirectMessage,
  useCreateDirectConversation,
} from "@/features/chat/hooks";
import { useCurrentUserId } from "@/components/current-user-provider";

interface DashboardChatContentProps {
  currentUserId?: string;
}

function ChatInner({ currentUserId }: DashboardChatContentProps) {
  const ctxUserId = useCurrentUserId();
  const effectiveUserId = currentUserId ?? ctxUserId ?? null;
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newConvOpen, setNewConvOpen] = useState(false);

  const { data: conversations = [], isLoading: loadingConvs } = useDirectConversations();
  const { data: messages = [], isLoading: loadingMessages } = useConversationMessages(selectedConversationId);
  const { mutateAsync: sendMessage, isPending: isSending } = useSendDirectMessage();
  const { mutateAsync: createConversation } = useCreateDirectConversation();

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId) ?? null;

  const handleSend = async (content: string) => {
    if (!selectedConversationId) return;
    try {
      await sendMessage({ conversationId: selectedConversationId, body: { content } });
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const handleStartDM = async (targetUserId: string) => {
    try {
      const { conversation } = await createConversation({ type: "DIRECT", targetUserId });
      setSelectedConversationId(conversation.id);
    } catch (err) {
      console.error("Failed to create DM", err);
    }
  };

  const handleCreateGroup = async (name: string, participantUserIds: string[]) => {
    try {
      const { conversation } = await createConversation({
        type: "GROUP",
        name,
        participantUserIds: [currentUserId, ...participantUserIds],
      });
      setSelectedConversationId(conversation.id);
    } catch (err) {
      console.error("Failed to create group", err);
    }
  };

  if (!effectiveUserId) {
    return (
      <div className="p-6 text-sm text-gray-500">Sign-in required to use chat.</div>
    );
  }

  return (
    <>
      <div className="flex h-full overflow-hidden">
        {/* Sidebar */}
        <ConversationSidebar
          conversations={conversations}
          currentUserId={effectiveUserId}
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
          onNewConversation={() => setNewConvOpen(true)}
          isLoading={loadingConvs}
          className="w-80 flex-shrink-0"
        />

        {/* Chat area */}
        <ChatArea
          conversation={selectedConversation}
          messages={messages}
          currentUserId={effectiveUserId}
          onSendMessage={handleSend}
          isSending={isSending}
          isLoadingMessages={loadingMessages}
          className="flex-1"
        />
      </div>

      <NewConversationModal
        open={newConvOpen}
        onClose={() => setNewConvOpen(false)}
        onStartDM={handleStartDM}
        onCreateGroup={handleCreateGroup}
      />
    </>
  );
}

export function DashboardChatContent({ currentUserId }: DashboardChatContentProps) {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <ChatInner currentUserId={currentUserId} />
    </QueryClientProvider>
  );
}
