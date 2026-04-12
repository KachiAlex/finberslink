"use client";

import React from 'react';

export const TooltipProvider = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

export const Tooltip = ({ children }: { children: React.ReactNode }) => (
  <div className="relative inline-block">
    {children}
  </div>
);

export const TooltipTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, ...props }, ref) => (
  <button ref={ref} {...props}>
    {children}
  </button>
));

TooltipTrigger.displayName = 'TooltipTrigger';

export const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`absolute z-50 rounded-md bg-gray-900 px-2 py-1 text-sm text-white shadow-md ${className}`}
    {...props}
  >
    {children}
  </div>
));

TooltipContent.displayName = 'TooltipContent';
