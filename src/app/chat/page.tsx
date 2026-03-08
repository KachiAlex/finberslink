"use client";

import { useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChatSpaceList, ChatThreadList, ChatMessageList, ChatInput } from "@/features/chat/components";

export default function ChatPage() {
  const [space, setSpace] = useState<any>(null);
  const [thread, setThread] = useState<any>(null);
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen bg-white">
        <ChatSpaceList selected={space} onSelect={setSpace} />
        <ChatThreadList spaceId={space?.id} selected={thread} onSelect={setThread} />
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-2 font-semibold text-sm border-b border-gray-200">
            {thread ? thread.title || thread.type : "Pick a thread"}
          </div>
          <ChatMessageList threadId={thread?.id} />
          <ChatInput threadId={thread?.id} />
        </div>
      </div>
    </QueryClientProvider>
  );
}
