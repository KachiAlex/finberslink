"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: string;
  width?: number;
  height?: number;
}

export function SafeImage({ 
  src, 
  alt, 
  className, 
  fallback = "/finbers-logo.png",
  width = 400,
  height = 300 
}: SafeImageProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  if (!src) {
    return (
      <div 
        className={cn("bg-slate-100 flex items-center justify-center", className)}
        style={{ width, height }}
      >
        <img 
          src={fallback} 
          alt={alt}
          className="max-w-full max-h-full object-contain opacity-50"
        />
      </div>
    );
  }

  const imageUrl = src.startsWith('http') ? src : `${src}`;

  return (
    <div className={cn("relative bg-slate-100", className)} style={{ width, height }}>
      {!imgLoaded && !imgError && (
        <div className="absolute inset-0 bg-slate-100 animate-pulse" />
      )}
      
      <img
        src={imgError ? fallback : imageUrl}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          imgLoaded ? "opacity-100" : "opacity-0",
          imgError ? "opacity-50" : ""
        )}
        style={{ width, height }}
        onLoad={() => {
          setImgLoaded(true);
          setImgError(false);
        }}
        onError={() => {
          setImgError(true);
          setImgLoaded(false);
        }}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
      
      {imgError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <div className="text-center p-2">
            <div className="text-2xl mb-1">🖼️</div>
            <div className="text-xs text-slate-500">Image unavailable</div>
          </div>
        </div>
      )}
    </div>
  );
}
