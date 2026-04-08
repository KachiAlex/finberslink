"use client";

import React from "react";

import { DashboardCoursesTab } from "@/components/dashboard/dashboard-courses-tab-new";

export default function TestCoursesPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test Courses Tab</h1>
      <DashboardCoursesTab loading={false} />
    </div>
  );
}
