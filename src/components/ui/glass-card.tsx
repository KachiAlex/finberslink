"use client";

import React from 'react';

export const GlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-lg backdrop-blur-md bg-white/30 border border-white/20 shadow-lg ${className}`}
    {...props}
  />
));

GlassCard.displayName = 'GlassCard';
