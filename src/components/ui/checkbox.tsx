import React from "react";

export const Checkbox = React.forwardRef<HTMLInputElement, any>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={`h-4 w-4 rounded border border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
      {...props}
    />
  )
);

Checkbox.displayName = "Checkbox";
