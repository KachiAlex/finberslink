"use client";

import React from 'react';

export const UniversalVideo = React.forwardRef<
  HTMLVideoElement,
  React.VideoHTMLAttributes<HTMLVideoElement>
>(({ className = '', ...props }, ref) => (
  <video
    ref={ref}
    className={`w-full h-auto rounded-lg ${className}`}
    controls
    {...props}
  />
));

UniversalVideo.displayName = 'UniversalVideo';
