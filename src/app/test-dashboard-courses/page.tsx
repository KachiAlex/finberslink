"use client";

import React from "react";
import { DashboardCoursesTab } from "@/components/dashboard/dashboard-courses-tab-new";

export default function TestDashboardCoursesPage() {
  const mockProps = {
    assigned: [],
    initialCatalog: [],
    initialPagination: { page: 1, pageSize: 12, total: 0, totalPages: 0 },
    initialFilters: { search: "", level: "all", category: "all", sort: "recent", page: 1 },
    loading: false,
  };

  return (
    <div className="container mx-auto p-6 min-h-screen bg-gray-50">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Test Dashboard Courses Tab</h1>
        <p className="text-gray-600 mt-2">This page tests the reorganized courses tab component</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <DashboardCoursesTab {...mockProps} />
      </div>
    </div>
  );
}
