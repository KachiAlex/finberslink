"use client";

import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DirectMessageContact {
  id: string;
  name: string;
  avatarUrl?: string;
  role: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount?: number;
}

interface DirectMessagesListProps {
  contacts: DirectMessageContact[];
  selectedContactId?: string;
  onSelectContact: (contact: DirectMessageContact) => void;
  onCreateDM?: () => void;
}

export function DirectMessagesList({
  contacts,
  selectedContactId,
  onSelectContact,
  onCreateDM,
}: DirectMessagesListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-80">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Messages</h2>
          {onCreateDM && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onCreateDM}
              className="p-1 h-8 w-8"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9 text-sm"
          />
        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-500">
            No conversations yet
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => onSelectContact(contact)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors hover:bg-slate-100 ${
                  selectedContactId === contact.id ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium text-slate-900 truncate">
                        {contact.name}
                      </h3>
                      {contact.unreadCount ? (
                        <span className="inline-flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-blue-600 rounded-full flex-shrink-0">
                          {contact.unreadCount}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-500">{contact.role}</p>
                    {contact.lastMessage && (
                      <p className="text-xs text-slate-500 truncate mt-1">
                        {contact.lastMessage}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
