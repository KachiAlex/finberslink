"use client";

import React from 'react';

export const GlassCardError = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-lg backdrop-blur-md bg-red-500/30 border border-red-200/50 shadow-lg ${className}`}
    {...props}
  />
));

GlassCardError.displayName = 'GlassCardError';
