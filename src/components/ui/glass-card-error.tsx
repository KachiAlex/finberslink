import React from "react";

export const GlassCardError = ({ children, className = "" }: any) => (
  <div className={`rounded-lg bg-red-50/30 backdrop-blur-md border border-red-200/20 shadow-lg p-4 ${className}`}>
    {children}
  </div>
);
