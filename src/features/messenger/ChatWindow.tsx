import React from "react";

export function MessengerChatWindow({ messages, onSend, onTyping, typingUsers = [] }: {
  messages: any[];
  onSend: (content: string, file?: File) => void;
  onTyping?: () => void;
  typingUsers?: string[];
}) {
  const [input, setInput] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value);
    if (onTyping) onTyping();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  }

  return (
    <section className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50">
        {messages.map((msg) => (
          <div key={msg.id} className="max-w-lg">
            <div className="bg-white rounded-lg px-4 py-2 shadow text-sm">
              <span className="font-semibold">{msg.author?.firstName || msg.authorId}:</span> {msg.content}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mt-2">
                  {msg.attachments.map((att: any, i: number) => (
                    <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">
                      {att.type?.startsWith("image/") ? <img src={att.url} alt="attachment" className="max-h-32" /> : att.url}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {typingUsers.length > 0 && (
          <div className="text-xs text-blue-500 mt-2">
            {typingUsers.join(", ")} typing...
          </div>
        )}
      </div>
      <form
        className="flex gap-2 p-4 border-t bg-white"
        onSubmit={e => {
          e.preventDefault();
          if (input.trim() || file) {
            onSend(input, file || undefined);
            setInput("");
            setFile(null);
          }
        }}
      >
        <input
          className="flex-1 border rounded px-3 py-2"
          value={input}
          onChange={handleInput}
          placeholder="Type a message..."
        />
        <input type="file" onChange={handleFileChange} className="text-xs" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Send</button>
      </form>
    </section>
  );
}
