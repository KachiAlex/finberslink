"use client";
import { useState } from "react";
import Link from "next/link";
import { ThreadCreateForm } from "@/features/forum/components/ThreadCreateForm";
import { ThreadList } from "@/features/forum/components/ThreadList";
import { ForumThread } from "@/features/forum/types";

export default function ForumPage() {
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);
  const courseId = "demo-course-id"; // Replace with actual courseId from context/session

  const handleThreadSelect = (thread: ForumThread) => {
    // Navigate to the thread page instead of showing inline details
    window.location.href = `/forum/${thread.id}`;
  };

  const handleThreadCreated = () => {
    setSelectedThread(null);
    // Could trigger a refresh of the thread list here
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Community Forum</h1>
        <Link 
          href="/dashboard/chat" 
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Go to Chat →
        </Link>
      </div>
      
      <div className="mb-8 bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">Start a New Discussion</h2>
        <ThreadCreateForm courseId={courseId} onCreated={handleThreadCreated} />
      </div>
      
      <div className="mb-6 bg-white p-4 rounded-lg border">
        <div className="mb-4 flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search threads or filter by tag..."
            value={searchQuery || selectedTag || ''}
            onChange={e => {
              setSearchQuery(e.target.value);
              setSelectedTag(undefined);
            }}
            className="border p-2 rounded flex-1"
          />
          <input
            type="text"
            placeholder="Filter by tag..."
            value={selectedTag || ''}
            onChange={e => setSelectedTag(e.target.value || undefined)}
            className="border p-2 rounded"
          />
          <button 
            onClick={() => { setSelectedTag(undefined); setSearchQuery(''); }} 
            className="text-xs underline px-2 py-1 hover:bg-gray-100 rounded"
          >
            Clear
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          {searchQuery && `Searching for: "${searchQuery}"`}
          {selectedTag && `Filtering by tag: "${selectedTag}"`}
          {!searchQuery && !selectedTag && "Showing all threads"}
        </div>
      </div>
      
      <div className="bg-white rounded-lg border">
        <ThreadList 
          tag={selectedTag} 
          onSelect={handleThreadSelect} 
          query={searchQuery || undefined}
          courseId={courseId}
        />
      </div>
      
      {selectedThread && (
        <div className="mt-8 p-4 border rounded bg-gray-50">
          <h2 className="font-semibold text-lg mb-2">{selectedThread.title}</h2>
          <div className="text-xs text-gray-500 mb-2 flex gap-2 flex-wrap">
            {selectedThread.tags?.map((tag: string) => (
              <span key={tag} className="bg-gray-200 px-2 py-0.5 rounded">{tag}</span>
            ))}
          </div>
          <p className="text-sm text-gray-700 mb-4">
            Click on a thread to view the full discussion and participate.
          </p>
          <button 
            onClick={() => setSelectedThread(null)} 
            className="mt-4 text-xs underline hover:text-blue-600"
          >
            Back to thread list
          </button>
        </div>
      )}
    </div>
  );
}
