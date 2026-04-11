import React from "react";

export const Dialog = ({ children }: any) => (
  <div>{children}</div>
);

export const DialogTrigger = ({ children, className = "" }: any) => (
  <button className={className}>{children}</button>
);

export const DialogContent = ({ children }: any) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
      {children}
    </div>
  </div>
);

export const DialogHeader = ({ children }: any) => (
  <div className="border-b border-gray-200 px-6 py-4">
    {children}
  </div>
);

export const DialogTitle = ({ children }: any) => (
  <h2 className="text-lg font-semibold text-gray-900">
    {children}
  </h2>
);

export const DialogDescription = ({ children }: any) => (
  <p className="text-sm text-gray-600">
    {children}
  </p>
);
