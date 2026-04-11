import React from "react";

export const Label = ({ children, htmlFor, className = "" }: any) => (
  <label
    htmlFor={htmlFor}
    className={`text-sm font-medium text-gray-700 ${className}`}
  >
    {children}
  </label>
);
