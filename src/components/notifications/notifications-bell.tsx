"use client";

import React from "react";
import { Bell } from "lucide-react";

export function NotificationsBell() {
  return (
    <button className="relative p-2 text-gray-600 hover:text-gray-900">
      <Bell className="h-5 w-5" />
      <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
    </button>
  );
}
