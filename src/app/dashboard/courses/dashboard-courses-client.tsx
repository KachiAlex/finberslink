"use client";

import React from "react";

import { DashboardCoursesTab } from "@/components/dashboard/dashboard-courses-tab-new";
// import { SimpleCoursesTab } from "@/components/dashboard/simple-courses-tab";

interface DashboardCoursesClientProps {
  assigned?: any[];
  initialCatalog?: any[];
  initialPagination?: any;
  initialFilters?: any;
  loading?: boolean;
}

export function DashboardCoursesClient({ 
  assigned = [],
  initialCatalog = [],
  initialPagination,
  initialFilters,
  loading = false 
}: DashboardCoursesClientProps) {
  console.log("DashboardCoursesClient rendering with props:", { assigned, initialCatalog, initialPagination, initialFilters, loading });
  return <DashboardCoursesTab 
    assigned={assigned}
    initialCatalog={initialCatalog}
    initialPagination={initialPagination}
    initialFilters={initialFilters}
    loading={loading}
  />;
}
