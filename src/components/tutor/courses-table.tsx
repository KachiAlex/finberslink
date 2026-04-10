"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Filter, Edit, Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { useCreateCourseModal } from "../../components/course/create-course-modal";
import { getTutorCourses } from "../../features/tutor/service";

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
  onCourseCreated?: () => void;
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

export function CoursesTable({ courses, onDeleteSuccess, onCourseCreated }: CoursesTableProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCourseForDelete, setSelectedCourseForDelete] = useState<TutorCourse | null>(null);
  
  // Modal hook for course creation
  const { isOpen: isCreateModalOpen, openModal: openCreateModal, closeModal: closeCreateModal, CreateCourseModal } = useCreateCourseModal("tutor");

  const handleCourseCreated = () => {
    onCourseCreated?.(); // Refresh the course list
    closeCreateModal();   // Close the modal
  };

  // Simplified filter for Draft vs Published
  const simplifiedStatusFilter = statusFilter === "DRAFT" ? "DRAFT" : 
                                statusFilter === "APPROVED" ? "APPROVED" : "all";

  // Filter and search logic
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        course.tagline.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = categoryFilter === "all" || course.category === categoryFilter;
      const matchesLevel = levelFilter === "all" || course.level === levelFilter;
      const matchesStatus = simplifiedStatusFilter === "all" || 
        (simplifiedStatusFilter === "DRAFT" && course.approvalStatus === "DRAFT") ||
        (simplifiedStatusFilter === "APPROVED" && course.approvalStatus === "APPROVED");

      return matchesSearch && matchesCategory && matchesLevel && matchesStatus;
    });
  }, [courses, search, categoryFilter, levelFilter, simplifiedStatusFilter]);

  const handleDeleteClick = (course: TutorCourse) => {
    setSelectedCourseForDelete(course);
    setDeleteDialogOpen(true);
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
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          New Course
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
          <div className="grid gap-4 md:grid-cols-3">
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

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                <Filter className="h-4 w-4 inline mr-2" />
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Courses</option>
                <option value="DRAFT">Draft</option>
                <option value="APPROVED">Published</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Courses List */}
      <Card className="border border-slate-200/70 bg-white/95">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900">
              All Courses ({filteredCourses.length})
            </CardTitle>
            <Badge variant="outline" className="text-sm">
              {statusFilter === "all" ? "All Statuses" : 
               statusFilter === "DRAFT" ? "Draft" : "Published"}
            </Badge>
          </div>
          <CardDescription>
            {statusFilter === "all" 
              ? "All your courses in one place. Use filters to narrow down results."
              : statusFilter === "DRAFT" 
                ? "Courses you're working on. Complete and submit them for review."
                : "Published courses that students can enroll in."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-4">
                <Plus className="h-6 w-6 text-slate-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {statusFilter === "all" ? "No courses yet" : 
                 statusFilter === "DRAFT" ? "No draft courses" : "No published courses"}
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                {statusFilter === "all" 
                  ? "Start by creating your first course"
                  : statusFilter === "DRAFT"
                    ? "Create a new draft course to get started"
                    : "Publish a draft course to see it here"
                }
              </p>
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Course
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between hover:border-slate-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <Badge className={getStatusColor(course.approvalStatus)}>
                          {getStatusLabel(course.approvalStatus)}
                        </Badge>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{course.title}</p>
                        <p className="text-sm text-slate-600">{course.tagline}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span>{course.category}</span>
                          <span>•</span>
                          <Badge variant="secondary" className="text-xs">
                            {course.level}
                          </Badge>
                          <span>•</span>
                          <span>Created {new Date(course.createdAt).toLocaleDateString()}</span>
                          {course.enrollmentCount && course.enrollmentCount > 0 && (
                            <>
                              <span>•</span>
                              <span>{course.enrollmentCount} enrolled</span>
                            </>
                          )}
                        </div>
                        {course.hasPendingEdit && (
                          <p className="text-xs text-violet-600 mt-1">Edit pending admin approval</p>
                        )}
                        {course.tutorEditingLocked && (
                          <p className="text-xs text-slate-500 mt-1">
                            Locked for review
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      disabled={course.tutorEditingLocked && course.approvalStatus !== "APPROVED"}
                    >
                      <Link href={`/tutor/courses/${course.slug}/edit`}>
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Create Course Modal */}
      <CreateCourseModal onCourseCreated={handleCourseCreated} />

    </div>
  );
}
