import { ChatSpace, ChatThread, ChatMessage, useChatSpaces, useChatThreads, useChatMessages, useMarkThreadRead, useSendChatMessage } from "../hooks";
import { useEffect, useState } from "react";

export function ChatSpaceList({
  selected,
  onSelect,
}: {
  selected?: ChatSpace;
  onSelect: (_space: ChatSpace) => void;
}) {
  const { data: spaces = [], isLoading } = useChatSpaces();

  if (isLoading) return <div className="p-2 text-sm text-gray-500">Loading spaces…</div>;

  return (
    <div className="border-r border-gray-200 w-64 flex flex-col">
      <div className="px-4 py-2 font-semibold text-sm border-b border-gray-200">Spaces</div>
      <div className="flex-1 overflow-y-auto">
        {spaces.map((space: ChatSpace) => (
          <button
            key={space.id}
            onClick={() => onSelect(space)}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${selected?.id === space.id ? "bg-gray-100" : ""}`}
          >
            {space.title}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ChatThreadList({
  spaceId,
  selected,
  onSelect,
}: {
  spaceId: string | null;
  selected?: ChatThread;
  onSelect: (_thread: ChatThread) => void;
}) {
  const { data: threads = [], isLoading } = useChatThreads(spaceId);

  if (isLoading) return <div className="p-2 text-sm text-gray-500">Loading threads…</div>;

  return (
    <div className="border-r border-gray-200 w-64 flex flex-col">
      <div className="px-4 py-2 font-semibold text-sm border-b border-gray-200">Threads</div>
      <div className="flex-1 overflow-y-auto">
        {threads.map((thread: ChatThread) => (
          <button
            key={thread.id}
            onClick={() => onSelect(thread)}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${selected?.id === thread.id ? "bg-gray-100" : ""}`}
          >
            {thread.title || thread.type}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ChatMessageList({ threadId }: { threadId: string | null }) {
  const { data: messages = [], isLoading } = useChatMessages(threadId);
  const markRead = useMarkThreadRead();

  useEffect(() => {
    if (threadId) {
      markRead.mutate({ threadId });
    }
  }, [threadId, markRead]);

  if (isLoading) return <div className="p-4 text-sm text-gray-500">Loading messages…</div>;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((m: ChatMessage) => (
        <div key={m.id} className="text-sm">
          <div className="font-semibold">{m.authorId}</div>
          <div className="text-gray-700">{m.content}</div>
        </div>
      ))}
    </div>
  );
}

export function ChatInput({ threadId }: { threadId: string | null }) {
  const send = useSendChatMessage();
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim() || !threadId) return;
    send.mutate(
      { threadId, content: text.trim() },
      { onSuccess: () => setText("") }
    );
  };

  return (
    <div className="border-t border-gray-200 p-3 flex gap-2">
      <input
        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
        placeholder="Type a message…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        disabled={!threadId || send.isPending}
      />
      <button
        onClick={handleSend}
        disabled={!threadId || send.isPending}
        className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
      >
        Send
      </button>
    </div>
  );
}
