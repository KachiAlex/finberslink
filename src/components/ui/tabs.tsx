import React from "react";

export const Tabs = ({ children, defaultValue }: any) => (
  <div>{children}</div>
);

export const TabsList = ({ children }: any) => (
  <div className="flex border-b border-gray-200">
    {children}
  </div>
);

export const TabsTrigger = ({ children, value }: any) => (
  <button className="px-4 py-2 border-b-2 border-transparent hover:border-blue-600">
    {children}
  </button>
);

export const TabsContent = ({ children, value }: any) => (
  <div>{children}</div>
);
