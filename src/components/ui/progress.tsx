import React from "react";

export const Progress = ({ value = 0, className = "" }: any) => (
  <div className={`h-2 w-full rounded-full bg-gray-200 overflow-hidden ${className}`}>
    <div
      className="h-full bg-blue-600 transition-all"
      style={{ width: `${value}%` }}
    />
  </div>
);
