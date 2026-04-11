import React from "react";

export const Button = ({ children, variant = "default", className = "", ...props }: any) => {
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-gray-300 text-gray-900 hover:bg-gray-50",
    ghost: "text-gray-900 hover:bg-gray-100",
  };

  return (
    <button
      className={`inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors ${variants[variant as keyof typeof variants] || variants.default} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
