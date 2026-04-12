import React from 'react';

export const Switch = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = '', ...props }, ref) => (
  <input
    ref={ref}
    type="checkbox"
    role="switch"
    className={`w-10 h-6 bg-gray-300 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    {...props}
  />
));

Switch.displayName = 'Switch';
