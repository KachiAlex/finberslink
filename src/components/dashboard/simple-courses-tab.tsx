"use client";

import React from "react";

export function SimpleCoursesTab() {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-slate-900">Courses Hub - Simple Version</h2>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">This is a simple test version to verify the component is loading.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900">Learning Pathway</h3>
          <p className="text-green-700 text-sm mt-2">Your enrolled courses would appear here</p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900">Assigned</h3>
          <p className="text-blue-700 text-sm mt-2">Your cohort courses would appear here</p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900">Discover</h3>
          <p className="text-yellow-700 text-sm mt-2">Browse courses would appear here</p>
        </div>
      </div>
    </div>
  );
}
