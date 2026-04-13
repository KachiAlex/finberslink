"use client";

import { useState } from 'react';
import { useCreateThread } from '@/hooks/useCreateThread';
import { MentionTextarea } from './MentionTextarea';

export function ThreadCreateForm({ courseId, onCreated }: { courseId: string; onCreated?: (thread: any) => void }) {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const { createThread, loading, error } = useCreateThread();

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput('');
    }
  };

  const [body, setBody] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const thread = await createThread({ title, courseId, tags, content: body });
    setTitle('');
    setTags([]);
    setBody('');
    if (onCreated) onCreated(thread);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Thread title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="border p-2 w-full"
        required
      />
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add tag"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          className="border p-2 flex-1"
        />
        <button type="button" onClick={handleAddTag} className="bg-blue-500 text-white px-3 py-1 rounded">Add Tag</button>
      </div>
      <MentionTextarea value={body} onChange={setBody} placeholder="Thread body (optional, supports @mentions)" />
      <div className="flex gap-2 flex-wrap">
        {tags.map(tag => (
          <span key={tag} className="bg-gray-200 px-2 py-1 rounded text-sm">{tag}</span>
        ))}
      </div>
      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded" disabled={loading}>
        {loading ? 'Creating...' : 'Create Thread'}
      </button>
      {error && <div className="text-red-600">{error}</div>}
    </form>
  );
}
