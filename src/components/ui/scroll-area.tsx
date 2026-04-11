import React from "react";

export const ScrollArea = ({ children, className = "" }: any) => (
  <div className={`overflow-auto ${className}`}>
    {children}
  </div>
);
