"use client";
import { useState } from "react";
import { ThreadCreateForm } from "@/features/forum/components/ThreadCreateForm";
import { ThreadList } from "@/features/forum/components/ThreadList";

export default function ForumPage() {
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedThread, setSelectedThread] = useState<any>(null);
  const courseId = "demo-course-id"; // Replace with actual courseId from context/session

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Forum</h1>
      <div className="mb-8">
        <ThreadCreateForm courseId={courseId} onCreated={() => setSelectedThread(null)} />
      </div>
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
        <button onClick={() => { setSelectedTag(undefined); setSearchQuery(''); }} className="text-xs underline">Clear</button>
      </div>
      <ThreadList tag={selectedTag} onSelect={setSelectedThread} query={searchQuery || undefined} />
      {selectedThread && (
        <div className="mt-8 p-4 border rounded bg-gray-50">
          <h2 className="font-semibold text-lg mb-2">{selectedThread.title}</h2>
          <div className="text-xs text-gray-500 mb-2 flex gap-2 flex-wrap">
            {selectedThread.tags?.map((tag: string) => (
              <span key={tag} className="bg-gray-200 px-2 py-0.5 rounded">{tag}</span>
            ))}
          </div>
          {/* Placeholder for thread details, posts, reactions, etc. */}
          <button onClick={() => setSelectedThread(null)} className="mt-4 text-xs underline">Back to threads</button>
        </div>
      )}
    </div>
  );
}
