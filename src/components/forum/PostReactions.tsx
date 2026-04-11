"use client";

import React from "react";
import { ThumbsUp, MessageCircle } from "lucide-react";

export function PostReactions({ postId }: any) {
  return (
    <div className="flex gap-4">
      <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
        <ThumbsUp className="h-4 w-4" />
        <span className="text-sm">Like</span>
      </button>
      <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
        <MessageCircle className="h-4 w-4" />
        <span className="text-sm">Reply</span>
      </button>
    </div>
  );
}
