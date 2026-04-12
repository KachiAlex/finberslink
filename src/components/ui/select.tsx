import React from 'react';

export const Select = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className = '', ...props }, ref) => (
  <button
    ref={ref}
    className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    {...props}
  />
));

SelectTrigger.displayName = 'SelectTrigger';

export const SelectValue = ({ placeholder }: { placeholder?: string }) => (
  <span>{placeholder || 'Select...'}</span>
);

export const SelectContent = ({ children }: { children: React.ReactNode }) => (
  <div className="border border-gray-300 rounded-md mt-1 bg-white shadow-lg">
    {children}
  </div>
);

export const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => (
  <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer">{children}</div>
);
