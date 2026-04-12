"use client";

import React from 'react';

export const Command = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-md border border-gray-200 bg-white ${className}`}
    {...props}
  >
    {children}
  </div>
));

Command.displayName = 'Command';

export const CommandInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = '', ...props }, ref) => (
  <input
    ref={ref}
    className={`w-full border-b border-gray-200 px-3 py-2 text-sm outline-none ${className}`}
    {...props}
  />
));

CommandInput.displayName = 'CommandInput';

export const CommandList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`max-h-64 overflow-y-auto ${className}`}
    {...props}
  >
    {children}
  </div>
));

CommandList.displayName = 'CommandList';

export const CommandEmpty = ({ children }: { children: React.ReactNode }) => (
  <div className="px-3 py-2 text-sm text-gray-500">
    {children}
  </div>
);

export const CommandGroup = ({ children, heading }: { children: React.ReactNode; heading?: string }) => (
  <div>
    {heading && <div className="px-3 py-1.5 text-xs font-medium text-gray-600">{heading}</div>}
    <div>
      {children}
    </div>
  </div>
);

export const CommandItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`cursor-pointer px-3 py-2 text-sm hover:bg-gray-100 ${className}`}
    {...props}
  >
    {children}
  </div>
));

CommandItem.displayName = 'CommandItem';
