import React, { useState } from 'react';

export const Dialog = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

export const DialogTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className = '', ...props }, ref) => (
  <button
    ref={ref}
    className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 ${className}`}
    {...props}
  />
));

DialogTrigger.displayName = 'DialogTrigger';

export const DialogContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`fixed inset-0 bg-black/50 flex items-center justify-center ${className}`}>
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
      {children}
    </div>
  </div>
);

export const DialogHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
);

export const DialogTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-lg font-semibold ${className}`}>{children}</h2>
);
