import React from "react";

export const Select = ({ children, ...props }: any) => (
  <div {...props}>{children}</div>
);

export const SelectTrigger = ({ children, className = "" }: any) => (
  <button className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}>
    {children}
  </button>
);

export const SelectValue = ({ placeholder }: any) => (
  <span className="text-gray-600">{placeholder}</span>
);

export const SelectContent = ({ children }: any) => (
  <div className="absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-300 bg-white shadow-md">
    {children}
  </div>
);

export const SelectItem = ({ children, value }: any) => (
  <div className="px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100">
    {children}
  </div>
);
