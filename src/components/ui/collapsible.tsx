"use client";

import React from 'react';

export const Collapsible = ({ children }: { children: React.ReactNode }) => (
  <div>
    {children}
  </div>
);

export const CollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, ...props }, ref) => (
  <button
    ref={ref}
    className="flex w-full items-center justify-between rounded-md border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
    {...props}
  >
    {children}
  </button>
));

CollapsibleTrigger.displayName = 'CollapsibleTrigger';

export const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`border-t border-gray-200 px-4 py-2 ${className}`}
    {...props}
  >
    {children}
  </div>
));

CollapsibleContent.displayName = 'CollapsibleContent';
