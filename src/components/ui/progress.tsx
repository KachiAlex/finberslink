import React from 'react';

export const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: number }
>(({ value = 0, className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`h-2 w-full bg-gray-200 rounded-full overflow-hidden ${className}`}
    {...props}
  >
    <div
      className="h-full bg-blue-500 transition-all"
      style={{ width: `${Math.min(value, 100)}%` }}
    />
  </div>
));

Progress.displayName = 'Progress';
