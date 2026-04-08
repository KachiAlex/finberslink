import React from "react";
import { MessengerSidebar } from "./Sidebar";
import { MessengerChatWindow } from "./ChatWindow";

const WS_URL = process.env.NEXT_PUBLIC_CHAT_WS_URL || "ws://localhost:4001";

export function MessengerApp() {
  const [threads, setThreads] = React.useState<any[]>([]);
  const [selectedThread, setSelectedThread] = React.useState<any | null>(null);
  const [messages, setMessages] = React.useState<any[]>([]);
  const [loadingThreads, setLoadingThreads] = React.useState(false);
  const [loadingMessages, setLoadingMessages] = React.useState(false);
  const [typingUsers, setTypingUsers] = React.useState<string[]>([]);
  const wsRef = React.useRef<WebSocket | null>(null);
  const typingTimeouts = React.useRef<Record<string, NodeJS.Timeout>>({});

  React.useEffect(() => {
    setLoadingThreads(true);
    fetch("/api/chat/threads?chatSpaceId=default")
      .then((res) => res.json())
      .then((data) => setThreads(data.threads || []))
      .finally(() => setLoadingThreads(false));
  }, []);

  React.useEffect(() => {
    if (selectedThread) {
      setLoadingMessages(true);
      fetch(`/api/chat/messages?threadId=${selectedThread.id}`)
        .then((res) => res.json())
        .then((data) => setMessages(data.messages || []))
        .finally(() => setLoadingMessages(false));
    } else {
      setMessages([]);
    }
  }, [selectedThread]);

  // WebSocket connection for real-time updates and typing
  React.useEffect(() => {
    if (!selectedThread) return;
    if (wsRef.current) wsRef.current.close();
    const ws = new window.WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join", threadId: selectedThread.id }));
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message" && data.threadId === selectedThread.id) {
          setMessages((msgs) => [...msgs, data.message]);
        }
        if (data.type === "typing" && data.threadId === selectedThread.id && data.user) {
          setTypingUsers((users) => {
            if (users.includes(data.user)) return users;
            return [...users, data.user];
          });
          // Remove typing indicator after 3s
          if (typingTimeouts.current[data.user]) clearTimeout(typingTimeouts.current[data.user]);
          typingTimeouts.current[data.user] = setTimeout(() => {
            setTypingUsers((users) => users.filter((u) => u !== data.user));
          }, 3000);
        }
      } catch {}
    };
    ws.onclose = () => {};
    return () => {
      ws.close();
      setTypingUsers([]);
    };
  }, [selectedThread]);

  async function handleSend(content: string, file?: File) {
    if (!selectedThread) return;
    let attachments: any[] = [];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/chat/attachments", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        attachments = [{ url: data.url, type: file.type }];
      }
    }
    const res = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId: selectedThread.id, content, attachments }),
    });
    const data = await res.json();
    if (data.message) {
      setMessages((msgs) => [...msgs, data.message]);
      if (wsRef.current && wsRef.current.readyState === 1) {
        wsRef.current.send(JSON.stringify({ type: "message", threadId: selectedThread.id, message: data.message }));
      }
    }
  }

  function handleTyping() {
    if (wsRef.current && wsRef.current.readyState === 1 && selectedThread) {
      wsRef.current.send(JSON.stringify({ type: "typing", threadId: selectedThread.id, user: "Someone" }));
    }
  }

  return (
    <div className="flex h-full">
      <MessengerSidebar
        threads={threads}
        onSelect={setSelectedThread}
        selectedId={selectedThread?.id}
      />
      <div className="flex-1 flex flex-col">
        {loadingMessages ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">Loading messages…</div>
        ) : (
          <MessengerChatWindow
            messages={messages}
            onSend={handleSend}
            onTyping={handleTyping}
            typingUsers={typingUsers}
          />
        )}
      </div>
    </div>
  );
}
