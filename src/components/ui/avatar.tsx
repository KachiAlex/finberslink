"use client";

import React from 'react';

export const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center ${className}`}
    {...props}
  />
));

Avatar.displayName = 'Avatar';

export const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className = '', ...props }, ref) => (
  <img
    ref={ref}
    className={`h-full w-full rounded-full object-cover ${className}`}
    {...props}
  />
));

AvatarImage.displayName = 'AvatarImage';

export const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`h-full w-full rounded-full bg-gray-400 flex items-center justify-center text-white ${className}`}
    {...props}
  />
));

AvatarFallback.displayName = 'AvatarFallback';
