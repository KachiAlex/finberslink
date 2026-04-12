"use client";

import React from "react";

export const DropdownMenu = ({ children }: any) => (
  <div>{children}</div>
);

export const DropdownMenuTrigger = ({ children, className = "" }: any) => (
  <button className={className}>{children}</button>
);

export const DropdownMenuContent = ({ children }: any) => (
  <div className="absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-300 bg-white shadow-md">
    {children}
  </div>
);

export const DropdownMenuItem = ({ children }: any) => (
  <div className="px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100">
    {children}
  </div>
);
