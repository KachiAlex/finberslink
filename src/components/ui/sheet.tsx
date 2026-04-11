import React from "react";

export const Sheet = ({ children }: any) => (
  <div>{children}</div>
);

export const SheetTrigger = ({ children, className = "" }: any) => (
  <button className={className}>{children}</button>
);

export const SheetContent = ({ children }: any) => (
  <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-gray-200 bg-white shadow-lg">
    {children}
  </div>
);

export const SheetHeader = ({ children }: any) => (
  <div className="border-b border-gray-200 px-6 py-4">
    {children}
  </div>
);

export const SheetTitle = ({ children }: any) => (
  <h2 className="text-lg font-semibold text-gray-900">
    {children}
  </h2>
);
