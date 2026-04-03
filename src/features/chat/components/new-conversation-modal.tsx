"use client";

import { useState, useEffect } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./user-avatar";
import { cn } from "@/lib/utils";

interface UserSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  role?: string;
}

interface NewConversationModalProps {
  open: boolean;
  onClose: () => void;
  onStartDM: (userId: string) => void;
  onCreateGroup: (name: string, userIds: string[]) => void;
}

export function NewConversationModal({
  open,
  onClose,
  onStartDM,
  onCreateGroup,
}: NewConversationModalProps) {
  const [mode, setMode] = useState<"dm" | "group">("dm");
  const [searchTerm, setSearchTerm] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>([]);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setGroupName("");
      setSelectedUsers([]);
      setSearchResults([]);
      setMode("dm");
    }
  }, [open]);

  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }
    const controller = new AbortController();
    setIsSearching(true);
    fetch(`/api/users/search?q=${encodeURIComponent(searchTerm)}`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        setSearchResults(data.users || []);
        setIsSearching(false);
      })
      .catch(() => setIsSearching(false));
    return () => controller.abort();
  }, [searchTerm]);

  const handleSelectUser = (user: UserSearchResult) => {
    if (mode === "dm") {
      onStartDM(user.id);
      onClose();
    } else {
      if (!selectedUsers.find((u) => u.id === user.id)) {
        setSelectedUsers((prev) => [...prev, user]);
      }
      setSearchTerm("");
      setSearchResults([]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedUsers.length < 2) return;
    onCreateGroup(groupName.trim(), selectedUsers.map((u) => u.id));
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">New Message</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-4">
          {(["dm", "group"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors",
                mode === m
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {m === "dm" ? "Direct Message" : "Group Chat"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Group name input */}
          {mode === "group" && (
            <Input
              placeholder="Group name (required)"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="h-10"
            />
          )}

          {/* Selected users (group mode) */}
          {mode === "group" && selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-1.5 bg-blue-50 rounded-full pl-2 pr-1 py-1"
                >
                  <UserAvatar
                    avatarUrl={u.avatarUrl}
                    firstName={u.firstName}
                    lastName={u.lastName}
                    size="xs"
                  />
                  <span className="text-xs text-blue-700 font-medium">
                    {u.firstName} {u.lastName}
                  </span>
                  <button
                    onClick={() => handleRemoveUser(u.id)}
                    className="h-4 w-4 flex items-center justify-center rounded-full hover:bg-blue-200 text-blue-500 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Search by name…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          {/* Results */}
          <div className="space-y-1 max-h-56 overflow-y-auto">
            {isSearching && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            )}
            {!isSearching && searchTerm.length >= 2 && searchResults.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">No users found</p>
            )}
            {searchResults.map((user) => {
              const alreadySelected = selectedUsers.some((u) => u.id === user.id);
              return (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  disabled={alreadySelected}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left",
                    alreadySelected ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50"
                  )}
                >
                  <UserAvatar
                    avatarUrl={user.avatarUrl}
                    firstName={user.firstName}
                    lastName={user.lastName}
                    size="sm"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {user.firstName} {user.lastName}
                    </p>
                    {user.role && (
                      <p className="text-xs text-slate-500 capitalize">{user.role.toLowerCase()}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer (group mode only) */}
        {mode === "group" && (
          <div className="px-5 pb-5">
            <Button
              className="w-full"
              disabled={!groupName.trim() || selectedUsers.length < 2}
              onClick={handleCreateGroup}
            >
              Create Group ({selectedUsers.length} selected)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
