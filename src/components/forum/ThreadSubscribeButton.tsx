"use client";

import React from "react";
import { Bell } from "lucide-react";

export function ThreadSubscribeButton({ threadId }: any) {
  return (
    <button className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
      <Bell className="h-4 w-4" />
      <span>Subscribe</span>
    </button>
  );
}
