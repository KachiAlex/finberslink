"use client";

import React from 'react';

export const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-lg border border-gray-200 bg-white p-4 ${className}`}
    {...props}
  />
));

Alert.displayName = 'Alert';

export const AlertDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`text-sm text-gray-600 ${className}`}
    {...props}
  />
));

AlertDescription.displayName = 'AlertDescription';
