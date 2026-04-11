"use client";

import React from "react";
import { Trash2, Edit } from "lucide-react";

export function PostModerationButtons({ postId }: any) {
  return (
    <div className="flex gap-2">
      <button className="p-2 text-gray-600 hover:text-blue-600">
        <Edit className="h-4 w-4" />
      </button>
      <button className="p-2 text-gray-600 hover:text-red-600">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
