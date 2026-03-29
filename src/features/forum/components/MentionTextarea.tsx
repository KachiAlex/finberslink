import React, { useState, useRef, useEffect } from 'react';

export function MentionTextarea({ value, onChange, placeholder = 'Write a reply...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!query) return setSuggestions([]);
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) return setSuggestions([]);
        const data = await res.json();
        setSuggestions(data.users || []);
      } catch {
        setSuggestions([]);
      }
    }, 200);
    return () => clearTimeout(id);
  }, [query]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value;
    onChange(v);
    const match = v.slice(0, e.target.selectionStart).match(/(?:^|\s)@([a-zA-Z0-9_]*)$/);
    if (match) {
      setQuery(match[1]);
      setShow(true);
    } else {
      setShow(false);
      setQuery('');
    }
  }

  function chooseSuggestion(s: any) {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const before = value.slice(0, pos).replace(/(?:^|\s)@([a-zA-Z0-9_]*)$/, match => `${match.split('@')[0] || ''}@${s.handle} `);
    const after = value.slice(pos);
    const newVal = before + after;
    onChange(newVal);
    setShow(false);
    setSuggestions([]);
    setTimeout(() => ta.focus(), 0);
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full border p-2 rounded mb-2"
        rows={3}
      />
      {show && suggestions.length > 0 && (
        <ul className="absolute left-2 right-2 bg-white border rounded shadow mt-1 z-10 max-h-40 overflow-auto text-sm">
          {suggestions.map(s => (
            <li key={s.id} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => chooseSuggestion(s)}>
              @{s.handle} · {s.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
