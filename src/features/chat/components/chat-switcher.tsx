"use client";

import { useState } from "react";
import { MessageCircle, BookOpen, Users, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ChatMode = "direct" | "courses" | "community";

interface ChatSwitcherProps {
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  unreadCounts?: {
    direct?: number;
    courses?: number;
    community?: number;
  };
}

export function ChatSwitcher({
  currentMode,
  onModeChange,
  unreadCounts = {},
}: ChatSwitcherProps) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex gap-2 p-3">
        {/* Direct Messages Tab */}
        <button
          onClick={() => onModeChange("direct")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors relative ${
            currentMode === "direct"
              ? "bg-blue-100 text-blue-700"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Mail className="h-4 w-4" />
          Messages
          {unreadCounts.direct ? (
            <span className="ml-1 inline-flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full">
              {unreadCounts.direct}
            </span>
          ) : null}
        </button>

        {/* Courses Tab */}
        <button
          onClick={() => onModeChange("courses")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            currentMode === "courses"
              ? "bg-blue-100 text-blue-700"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Courses
          {unreadCounts.courses ? (
            <span className="ml-1 inline-flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full">
              {unreadCounts.courses}
            </span>
          ) : null}
        </button>

        {/* Community Tab */}
        <button
          onClick={() => onModeChange("community")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            currentMode === "community"
              ? "bg-blue-100 text-blue-700"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Users className="h-4 w-4" />
          Community
          {unreadCounts.community ? (
            <span className="ml-1 inline-flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full">
              {unreadCounts.community}
            </span>
          ) : null}
        </button>
      </div>
    </div>
  );
}
