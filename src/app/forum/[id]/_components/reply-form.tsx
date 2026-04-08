"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X } from "lucide-react";

type ReplyFormProps = {
  threadId: string;
  action: (formData: FormData) => Promise<void>;
  courseId?: string;
};

export default function ReplyForm({ threadId, action, courseId }: ReplyFormProps) {
  const [content, setContent] = useState("");
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<any[]>([]);
  const [selected, setSelected] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!query.trim()) {
        setMatches([]);
        return;
      }
      try {
        setIsLoading(true);
        const res = await fetch(
          `/api/forum/users?q=${encodeURIComponent(query.trim())}${courseId ? `&courseId=${courseId}` : ""}`
        );
        if (res.ok) {
          const data = await res.json();
          setMatches(data.users ?? []);
          setHighlight(0);
        }
      } finally {
        setIsLoading(false);
      }
    }, 150);
    return () => clearTimeout(handler);
  }, [query, courseId]);

  const mentionHandles = useMemo(() => {
    const handlesFromText = Array.from(
      new Set(
        [...content.matchAll(/@([\w-]+)/g)]
          .map((m) => m[1])
          .filter(Boolean)
      )
    );
    const handlesFromSelected = selected.map((u) => u.email.split("@")[0]);
    return Array.from(new Set([...handlesFromText, ...handlesFromSelected]));
  }, [content, selected]);

  const selectMatch = (u: any) => {
    if (selected.find((s) => s.id === u.id)) return;
    setSelected([...selected, u]);
    setQuery("");
    setMatches([]);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!matches.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + matches.length) % matches.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectMatch(matches[highlight]);
    }
  };

  return (
    <Card className="border border-slate-200/70 bg-white/95">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">Reply</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form
          className="space-y-4"
          action={async (formData) => {
            formData.set("threadId", threadId);
            formData.set("content", content);
            formData.set("mentions", mentionHandles.join(","));
            await action(formData);
          }}
        >
          <input type="hidden" name="threadId" value={threadId} />
          <input type="hidden" name="mentions" value={mentionHandles.join(",")} />
          <Textarea
            name="content"
            placeholder="Share your thoughts... use @username to mention"
            rows={4}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="space-y-2">
            <Input
              placeholder="Search users to mention"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
            />
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                Searching…
              </div>
            )}
            {matches.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {matches.map((u, idx) => (
                  <Badge
                    key={u.id}
                    variant="outline"
                    className={`cursor-pointer ${highlight === idx ? "border-indigo-400 text-indigo-700" : ""}`}
                    onClick={() => selectMatch(u)}
                  >
                    <span className="mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700">
                      {u.firstName?.[0]}
                      {u.lastName?.[0]}
                    </span>
                    @{u.email.split("@")[0]} ({u.firstName} {u.lastName})
                  </Badge>
                ))}
              </div>
            ) : query && !isLoading ? (
              <p className="text-xs text-slate-500">No users found</p>
            ) : null}
          </div>
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.map((u) => (
                <Badge key={u.id} variant="secondary" className="bg-indigo-50 text-indigo-700">
                  <span className="mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700">
                    {u.firstName?.[0]}
                    {u.lastName?.[0]}
                  </span>
                  @{u.email.split("@")[0]}
                  <button
                    type="button"
                    onClick={() => setSelected(selected.filter((s) => s.id !== u.id))}
                    className="ml-1 inline-flex"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <Button type="submit">Post reply</Button>
        </form>
      </CardContent>
    </Card>
  );
}
