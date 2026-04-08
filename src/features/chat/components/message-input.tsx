"use client";

import { useRef, useState, FormEvent } from "react";
import { Smile, Paperclip, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function MessageInput({
  onSend,
  disabled = false,
  placeholder = "Type a message…",
  className,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setContent("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  };

  return (
    <div
      className={cn(
        "flex items-end gap-2 px-4 py-3 border-t border-slate-200 bg-white",
        className
      )}
    >
      {/* Attachment button */}
      <button
        type="button"
        className="flex-shrink-0 p-1.5 text-slate-400 hover:text-blue-500 rounded-full transition-colors"
        title="Attach file"
      >
        <Paperclip className="h-5 w-5" />
      </button>

      {/* Text input */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            "w-full resize-none rounded-2xl border border-slate-200 bg-slate-50",
            "px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "transition-all duration-150",
            "max-h-[120px] overflow-y-auto",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
      </div>

      {/* Emoji button */}
      <button
        type="button"
        className="flex-shrink-0 p-1.5 text-slate-400 hover:text-yellow-500 rounded-full transition-colors"
        title="Add emoji"
      >
        <Smile className="h-5 w-5" />
      </button>

      {/* Send button */}
      <button
        type="button"
        onClick={handleSend}
        disabled={disabled || !content.trim()}
        className={cn(
          "flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-full",
          "transition-all duration-150",
          content.trim() && !disabled
            ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
            : "bg-slate-200 text-slate-400 cursor-not-allowed"
        )}
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}
