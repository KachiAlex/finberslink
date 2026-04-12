"use client";

import React from 'react';

export const Popover = ({ children }: { children: React.ReactNode }) => (
  <div className="relative inline-block">
    {children}
  </div>
);

export const PopoverTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, ...props }, ref) => (
  <button ref={ref} {...props}>
    {children}
  </button>
));

PopoverTrigger.displayName = 'PopoverTrigger';

export const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`absolute z-50 rounded-md border border-gray-200 bg-white p-4 shadow-md ${className}`}
    {...props}
  >
    {children}
  </div>
));

PopoverContent.displayName = 'PopoverContent';
