import React from "react";

export function MessengerSidebar({ threads, onSelect, selectedId }: {
  threads: any[];
  onSelect: (thread: any) => void;
  selectedId?: string;
}) {
  return (
    <aside className="w-72 border-r bg-white flex flex-col">
      <div className="p-4 font-bold text-lg border-b">Chats</div>
      <div className="flex-1 overflow-y-auto">
        {threads.map((thread) => (
          <button
            key={thread.id}
            className={`w-full text-left px-4 py-3 hover:bg-blue-50 ${selectedId === thread.id ? "bg-blue-100" : ""}`}
            onClick={() => onSelect(thread)}
          >
            <div className="font-medium">{thread.title || thread.type}</div>
            <div className="text-xs text-gray-500 truncate">{thread.lastMessage?.content || "No messages yet"}</div>
          </button>
        ))}
      </div>
    </aside>
  );
}
