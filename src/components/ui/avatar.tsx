import React from "react";

export const Avatar = ({ children, className = "" }: any) => (
  <div className={`inline-flex items-center justify-center rounded-full bg-gray-200 ${className}`}>
    {children}
  </div>
);

export const AvatarImage = ({ src, alt }: any) => (
  <img src={src} alt={alt} className="w-full h-full rounded-full object-cover" />
);

export const AvatarFallback = ({ children }: any) => (
  <span className="text-sm font-medium">{children}</span>
);
