"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Filter, Edit, Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeleteCourseDialog } from "./delete-course-dialog";

export interface TutorCourse {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  category: string;
  level: string;
  approvalStatus: string;
  createdAt: Date;
  updatedAt: Date;
  tutorEditingLocked: boolean;
  hasPendingEdit?: boolean;
  enrollmentCount?: number;
}

interface CoursesTableProps {
  courses: TutorCourse[];
  onDeleteSuccess?: () => void;
}

const COURSES_PER_PAGE = 10;
const CATEGORIES = ["Web Development", "Mobile Development", "Data Science", "AI/ML", "DevOps", "Cloud Computing", "Other"];
const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

const getStatusColor = (status: string) => {
  switch (status) {
    case "DRAFT":
      return "bg-amber-50 text-amber-700";
    case "PENDING":
      return "bg-blue-50 text-blue-700";
    case "APPROVED":
      return "bg-emerald-50 text-emerald-700";
    case "CHANGES":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-slate-50 text-slate-700";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "PENDING":
      return "Pending Review";
    case "APPROVED":
      return "Approved";
    case "CHANGES":
      return "Needs Updates";
    default:
      return status;
  }
};

export function CoursesTable({ courses, onDeleteSuccess }: CoursesTableProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCourseForDelete, setSelectedCourseForDelete] = useState<TutorCourse | null>(null);

  // Filter and search logic
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        course.tagline.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = categoryFilter === "all" || course.category === categoryFilter;
      const matchesLevel = levelFilter === "all" || course.level === levelFilter;

      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [courses, search, categoryFilter, levelFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredCourses.length / COURSES_PER_PAGE);
  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * COURSES_PER_PAGE;
    return filteredCourses.slice(start, start + COURSES_PER_PAGE);
  }, [filteredCourses, currentPage]);

  const handleDeleteClick = (course: TutorCourse) => {
    setSelectedCourseForDelete(course);
    setDeleteDialogOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">My Courses</h2>
          <p className="text-sm text-slate-600 mt-1">
            Manage your courses and track approvals ({filteredCourses.length} total)
          </p>
        </div>
        <Button asChild>
          <Link href="/tutor/courses/new">
            <Plus className="h-4 w-4 mr-2" />
            New Course
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="border border-slate-200/70 bg-white/95">
        <CardHeader>
          <CardTitle className="text-base">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by course name or description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                <Filter className="h-4 w-4 inline mr-2" />
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                <Filter className="h-4 w-4 inline mr-2" />
                Level
              </label>
              <select
                value={levelFilter}
                onChange={(e) => {
                  setLevelFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Levels</option>
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses Table */}
      {paginatedCourses.length === 0 ? (
        <Card className="border border-dashed border-slate-200 bg-slate-50/50">
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-slate-600 font-medium mb-2">No courses found</p>
            <p className="text-sm text-slate-500">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paginatedCourses.map((course) => (
                    <tr
                      key={course.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {course.title}
                          </p>
                          <p className="text-sm text-slate-500">
                            {course.tagline}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {course.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary">
                          {course.level}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={getStatusColor(course.approvalStatus)}>
                          {getStatusLabel(course.approvalStatus)}
                        </Badge>
                        {course.hasPendingEdit && (
                          <p className="text-xs text-violet-600 mt-1">Edit pending admin approval</p>
                        )}
                        {course.tutorEditingLocked && (
                          <p className="text-xs text-slate-500 mt-1">
                            Locked for review
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {new Date(course.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            disabled={course.tutorEditingLocked && course.approvalStatus !== "APPROVED"}
                          >
                            <Link
                              href={`/tutor/courses/${course.slug}/edit`}
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteClick(course)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Showing {paginatedCourses.length > 0 ? (currentPage - 1) * COURSES_PER_PAGE + 1 : 0} to{" "}
            {Math.min(currentPage * COURSES_PER_PAGE, filteredCourses.length)} of{" "}
            {filteredCourses.length} courses
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className="w-10"
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {selectedCourseForDelete && (
        <DeleteCourseDialog
          course={selectedCourseForDelete}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onDeleteSuccess={() => {
            onDeleteSuccess?.();
            setDeleteDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}
