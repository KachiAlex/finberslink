import React from "react";

export const GlassCard = ({ children, className = "" }: any) => (
  <div className={`rounded-lg bg-white/30 backdrop-blur-md border border-white/20 shadow-lg ${className}`}>
    {children}
  </div>
);
