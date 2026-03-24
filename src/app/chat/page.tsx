"use client";

import { useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChatSwitcher } from "@/features/chat/components/chat-switcher";
import { DirectMessagesList } from "@/features/chat/components/direct-messages-list";
import { CourseChatsList } from "@/features/chat/components/course-chats-list";
import { CommunityForumsList } from "@/features/chat/components/community-forums-list";
import { ChatMessageList, ChatInput } from "@/features/chat/components";

// Mock data - replace with actual API calls
const mockDirectMessages = [
  {
    id: "dm1",
    name: "Sarah Chen",
    role: "Tutor",
    lastMessage: "Great progress on the project!",
    lastMessageAt: new Date(),
    unreadCount: 2,
  },
  {
    id: "dm2",
    name: "Alex Johnson",
    role: "Student",
    lastMessage: "Can you help with the assignment?",
    lastMessageAt: new Date(),
    unreadCount: 0,
  },
  {
    id: "dm3",
    name: "Maria Garcia",
    role: "Student",
    lastMessage: "See you in the study group",
    lastMessageAt: new Date(),
    unreadCount: 0,
  },
];

const mockCourseChats = [
  {
    id: "course1",
    courseId: "c1",
    courseTitle: "Web Development 101",
    courseSlug: "web-dev-101",
    type: "general" as const,
    unreadCount: 3,
    lastMessage: "Anyone stuck on the CSS section?",
    participantCount: 42,
  },
  {
    id: "course2",
    courseId: "c1",
    courseTitle: "Web Development 101",
    courseSlug: "web-dev-101",
    type: "lesson" as const,
    unreadCount: 0,
    lastMessage: "Module 5: Advanced JavaScript",
  },
  {
    id: "course3",
    courseId: "c2",
    courseTitle: "React Mastery",
    courseSlug: "react-mastery",
    type: "general" as const,
    unreadCount: 1,
    lastMessage: "New assignment posted",
    participantCount: 28,
  },
];

const mockCommunityForums = [
  {
    id: "forum1",
    name: "General Discussion",
    description: "Off-topic conversations and introductions",
    memberCount: 542,
    unreadCount: 5,
  },
  {
    id: "forum2",
    name: "Career Advice",
    description: "Job search tips and career development",
    memberCount: 312,
    unreadCount: 0,
  },
  {
    id: "forum3",
    name: "Project Showcase",
    description: "Share your portfolio and projects",
    memberCount: 189,
    unreadCount: 0,
  },
];

export default function ChatPage() {
  const [chatMode, setChatMode] = useState<"direct" | "courses" | "community">(
    "direct"
  );
  const [selectedDM, setSelectedDM] = useState<string | undefined>();
  const [selectedCourse, setSelectedCourse] = useState<string | undefined>();
  const [selectedForum, setSelectedForum] = useState<string | undefined>();
  const queryClient = useMemo(() => new QueryClient(), []);

  const unreadCounts = {
    direct: mockDirectMessages.reduce((sum, dm) => sum + (dm.unreadCount || 0), 0),
    courses: mockCourseChats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0),
    community: mockCommunityForums.reduce((sum, forum) => sum + (forum.unreadCount || 0), 0),
  };

  const getHeaderTitle = () => {
    if (chatMode === "direct") {
      const selected = mockDirectMessages.find((dm) => dm.id === selectedDM);
      return selected?.name || "Select a conversation";
    } else if (chatMode === "courses") {
      const selected = mockCourseChats.find((chat) => chat.id === selectedCourse);
      return selected?.courseTitle || "Select a course chat";
    } else {
      const selected = mockCommunityForums.find((forum) => forum.id === selectedForum);
      return selected?.name || "Select a forum";
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col h-screen bg-slate-50">
        {/* Chat Mode Switcher */}
        <ChatSwitcher
          currentMode={chatMode}
          onModeChange={setChatMode}
          unreadCounts={unreadCounts}
        />

        {/* Main Chat Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Dynamic based on mode */}
          {chatMode === "direct" && (
            <DirectMessagesList
              contacts={mockDirectMessages}
              selectedContactId={selectedDM}
              onSelectContact={(contact) => setSelectedDM(contact.id)}
              onCreateDM={() => {
                // TODO: Implement create DM modal
              }}
            />
          )}

          {chatMode === "courses" && (
            <CourseChatsList
              chats={mockCourseChats}
              selectedChatId={selectedCourse}
              onSelectChat={(chat) => setSelectedCourse(chat.id)}
            />
          )}

          {chatMode === "community" && (
            <CommunityForumsList
              forums={mockCommunityForums}
              selectedForumId={selectedForum}
              onSelectForum={(forum) => setSelectedForum(forum.id)}
              onCreateForum={() => {
                // TODO: Implement create forum modal
              }}
            />
          )}

          {/* Chat Thread */}
          <div className="flex-1 flex flex-col bg-white">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">{getHeaderTitle()}</h2>
              <p className="text-sm text-slate-500 mt-1">
                {chatMode === "direct" && "Direct Message"}
                {chatMode === "courses" && "Course Discussion"}
                {chatMode === "community" && "Community Forum"}
              </p>
            </div>

            {/* Messages */}
            <ChatMessageList threadId={selectedDM || selectedCourse || selectedForum || null} />

            {/* Input */}
            <ChatInput threadId={selectedDM || selectedCourse || selectedForum || null} />
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
}
