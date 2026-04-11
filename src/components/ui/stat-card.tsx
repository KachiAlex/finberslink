import React from "react";

export const StatCard = ({ title, value, icon, className = "" }: any) => (
  <div className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm ${className}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
      {icon && <div className="text-gray-400">{icon}</div>}
    </div>
  </div>
);
