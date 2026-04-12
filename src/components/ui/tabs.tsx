"use client";

import React, { useState } from 'react';

export const Tabs = ({ children, defaultValue }: { children: React.ReactNode; defaultValue?: string }) => (
  <div>{children}</div>
);

export const TabsList = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex border-b border-gray-200 ${className}`}>{children}</div>
);

export const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { value?: string }
>(({ className = '', ...props }, ref) => (
  <button
    ref={ref}
    className={`px-4 py-2 border-b-2 border-transparent hover:border-blue-500 focus:outline-none ${className}`}
    {...props}
  />
));

TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = ({ children, value, className = '' }: { children: React.ReactNode; value?: string; className?: string }) => (
  <div className={`mt-4 ${className}`}>{children}</div>
);
