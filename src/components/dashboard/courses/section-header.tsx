"use client";

import React from "react";

interface SectionHeaderProps {
  title: string;
  description: string;
  count: number;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  count,
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          {count} {count === 1 ? "course" : "courses"}
        </span>
      </div>
      <p className="text-slate-600">{description}</p>
    </div>
  );
};
