import React from "react";

export const Card = ({ children, className = "" }: any) => (
  <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = "" }: any) => (
  <div className={`border-b border-gray-200 px-6 py-4 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = "" }: any) => (
  <h2 className={`text-lg font-semibold text-gray-900 ${className}`}>
    {children}
  </h2>
);

export const CardDescription = ({ children, className = "" }: any) => (
  <p className={`text-sm text-gray-600 ${className}`}>
    {children}
  </p>
);

export const CardContent = ({ children, className = "" }: any) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = "" }: any) => (
  <div className={`border-t border-gray-200 px-6 py-4 ${className}`}>
    {children}
  </div>
);
