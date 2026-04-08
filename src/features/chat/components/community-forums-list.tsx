"use client";

import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CommunityForum {
  id: string;
  name: string;
  description?: string;
  memberCount?: number;
  unreadCount?: number;
  lastMessage?: string;
}

interface CommunityForumsListProps {
  forums: CommunityForum[];
  selectedForumId?: string;
  onSelectForum: (forum: CommunityForum) => void;
  onCreateForum?: () => void;
}

export function CommunityForumsList({
  forums,
  selectedForumId,
  onSelectForum,
  onCreateForum,
}: CommunityForumsListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredForums = forums.filter((forum) =>
    forum.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-80">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Community</h2>
          {onCreateForum && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onCreateForum}
              className="p-1 h-8 w-8"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search forums..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9 text-sm"
          />
        </div>
      </div>

      {/* Forum List */}
      <div className="flex-1 overflow-y-auto">
        {filteredForums.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-500">
            No community forums yet
          </div>
        ) : (
          <div className="space-y-1 p-3">
            {filteredForums.map((forum) => (
              <button
                key={forum.id}
                onClick={() => onSelectForum(forum)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors hover:bg-slate-100 ${
                  selectedForumId === forum.id ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 line-clamp-1">
                      {forum.name}
                    </h3>
                    {forum.description && (
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {forum.description}
                      </p>
                    )}
                    {forum.memberCount && (
                      <p className="text-xs text-slate-500 mt-1">
                        {forum.memberCount} members
                      </p>
                    )}
                  </div>
                  {forum.unreadCount ? (
                    <span className="inline-flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-blue-600 rounded-full flex-shrink-0">
                      {forum.unreadCount}
                    </span>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
