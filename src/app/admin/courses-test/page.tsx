"use client";

import { AdminCoursesGrid } from "../../../components/admin/admin-courses-grid";

export default function TestAdminCoursesPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Admin Courses Dashboard (Test)</h1>
        <AdminCoursesGrid />
      </div>
    </div>
  );
}
