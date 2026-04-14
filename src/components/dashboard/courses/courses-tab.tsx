"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SearchBar } from "./search-bar";
import { SectionHeader } from "./section-header";
import { CourseCard } from "./course-card";
import { EmptyState } from "./empty-state";
import { Pagination } from "./pagination";
import { AlertCircle } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  category: string;
  coverImage: string;
  instructor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  enrollmentCount?: number;
  rating?: number;
}

interface AssignedCourse extends Course {
  assignmentId: string;
  status: string;
  assignedAt: Date;
  assignedBy: { firstName: string; lastName: string };
  notes?: string;
}

interface EnrolledCourse extends Course {
  enrollmentId: string;
  progressPercentage: number;
  enrolledAt: Date;
  lessonsCount: number;
  lessonsCompleted: number;
}

interface SectionState {
  courses: any[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    pages: number;
  };
}

export const CoursesTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  const [discover, setDiscover] = useState<SectionState>({
    courses: [],
    loading: true,
    error: null,
    pagination: { page: 1, pageSize: 12, total: 0, pages: 0 },
  });

  const [assigned, setAssigned] = useState<SectionState>({
    courses: [],
    loading: true,
    error: null,
    pagination: { page: 1, pageSize: 12, total: 0, pages: 0 },
  });

  const [enrolled, setEnrolled] = useState<SectionState>({
    courses: [],
    loading: true,
    error: null,
    pagination: { page: 1, pageSize: 12, total: 0, pages: 0 },
  });

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch discover courses
  const fetchDiscoverCourses = useCallback(async (page = 1) => {
    setDiscover((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const params = new URLSearchParams({
        skip: ((page - 1) * 12).toString(),
        take: "12",
      });
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory) params.append("category", selectedCategory);
      if (selectedLevel) params.append("level", selectedLevel);

      const response = await fetch(
        `/api/dashboard/courses/discover?${params}`
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch courses");
      }

      const data = await response.json();
      setDiscover({
        courses: data.data || [],
        loading: false,
        error: null,
        pagination: {
          page,
          pageSize: 12,
          total: data.pagination?.total || 0,
          pages: data.pagination?.pages || 0,
        },
      });
      setCategories(data.filters?.categories || []);
    } catch (error) {
      console.error("Discover courses error:", error);
      setDiscover((prev) => ({
        ...prev,
        courses: [],
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load courses",
      }));
    }
  }, [searchQuery, selectedCategory, selectedLevel]);

  // Fetch assigned courses
  const fetchAssignedCourses = useCallback(async (page = 1) => {
    setAssigned((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const params = new URLSearchParams({
        skip: ((page - 1) * 12).toString(),
        take: "12",
      });

      const response = await fetch(
        `/api/dashboard/courses/assigned?${params}`
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch assigned courses");
      }

      const data = await response.json();
      setAssigned({
        courses: data.data || [],
        loading: false,
        error: null,
        pagination: {
          page,
          pageSize: 12,
          total: data.pagination?.total || 0,
          pages: data.pagination?.pages || 0,
        },
      });
    } catch (error) {
      console.error("Assigned courses error:", error);
      setAssigned((prev) => ({
        ...prev,
        courses: [],
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load assigned courses",
      }));
    }
  }, []);

  // Fetch enrolled courses
  const fetchEnrolledCourses = useCallback(async (page = 1) => {
    setEnrolled((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const params = new URLSearchParams({
        skip: ((page - 1) * 12).toString(),
        take: "12",
      });

      const response = await fetch(
        `/api/dashboard/courses/enrolled?${params}`
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch enrolled courses");
      }

      const data = await response.json();
      setEnrolled({
        courses: data.data || [],
        loading: false,
        error: null,
        pagination: {
          page,
          pageSize: 12,
          total: data.pagination?.total || 0,
          pages: data.pagination?.pages || 0,
        },
      });
    } catch (error) {
      console.error("Enrolled courses error:", error);
      setEnrolled((prev) => ({
        ...prev,
        courses: [],
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load enrolled courses",
      }));
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchDiscoverCourses(1);
    fetchAssignedCourses(1);
    fetchEnrolledCourses(1);
  }, []);

  // Refetch discover when filters change
  useEffect(() => {
    fetchDiscoverCourses(1);
  }, [searchQuery, selectedCategory, selectedLevel, fetchDiscoverCourses]);

  const handleEnroll = async (courseId: string) => {
    setActionLoading(courseId);
    try {
      const response = await fetch("/api/dashboard/courses/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      if (!response.ok) throw new Error("Failed to enroll");

      // Refresh both discover and enrolled sections
      await fetchDiscoverCourses(discover.pagination.page);
      await fetchEnrolledCourses(1);
    } catch (error) {
      console.error("Enroll error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAccept = async (assignmentId: string) => {
    setActionLoading(assignmentId);
    try {
      const response = await fetch("/api/dashboard/courses/assign/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId }),
      });

      if (!response.ok) throw new Error("Failed to accept");

      // Refresh both assigned and enrolled sections
      await fetchAssignedCourses(assigned.pagination.page);
      await fetchEnrolledCourses(1);
    } catch (error) {
      console.error("Accept error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (assignmentId: string) => {
    if (!confirm("Are you sure you want to decline this course?")) return;

    setActionLoading(assignmentId);
    try {
      const response = await fetch("/api/dashboard/courses/assign/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId }),
      });

      if (!response.ok) throw new Error("Failed to decline");

      // Refresh assigned section
      await fetchAssignedCourses(assigned.pagination.page);
    } catch (error) {
      console.error("Decline error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const hasActiveFilters =
    searchQuery || selectedCategory || selectedLevel;

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <SearchBar
        onSearch={setSearchQuery}
        onCategoryChange={setSelectedCategory}
        onLevelChange={setSelectedLevel}
        onClearFilters={() => {
          setSearchQuery("");
          setSelectedCategory(null);
          setSelectedLevel(null);
        }}
        categories={categories}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Discover Section */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <SectionHeader
          title="🎓 Discover Courses"
          description="Explore admin-approved courses and expand your skills"
          count={discover.pagination.total}
        />

        {discover.error && !discover.loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-red-800 font-medium">{discover.error}</p>
              <button
                onClick={() => fetchDiscoverCourses(discover.pagination.page)}
                className="text-red-600 hover:text-red-700 text-sm mt-1 underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {discover.loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-200 rounded-lg h-96 animate-pulse"
              />
            ))}
          </div>
        ) : discover.courses.length === 0 ? (
          <EmptyState
            section="discover"
            hasFilters={hasActiveFilters}
            onClearFilters={() => {
              setSearchQuery("");
              setSelectedCategory(null);
              setSelectedLevel(null);
            }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {discover.courses.map((course) => (
                <CourseCard
                  key={course.id}
                  {...course}
                  section="discover"
                  onAction={() => handleEnroll(course.id)}
                  loading={actionLoading === course.id}
                />
              ))}
            </div>
            <Pagination
              currentPage={discover.pagination.page}
              totalPages={discover.pagination.pages}
              onPageChange={(page) => fetchDiscoverCourses(page)}
              loading={discover.loading}
            />
          </>
        )}
      </section>

      {/* Assigned Section */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <SectionHeader
          title="📋 Assigned Courses"
          description="Courses assigned by your administrator"
          count={assigned.pagination.total}
        />

        {assigned.error && !assigned.loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-red-800 font-medium">{assigned.error}</p>
              <button
                onClick={() => fetchAssignedCourses(assigned.pagination.page)}
                className="text-red-600 hover:text-red-700 text-sm mt-1 underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {assigned.loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-200 rounded-lg h-96 animate-pulse"
              />
            ))}
          </div>
        ) : assigned.courses.length === 0 ? (
          <EmptyState
            section="assigned"
            hasFilters={false}
            onBrowse={() => {
              // Scroll to discover section
              document
                .querySelector('[data-section="discover"]')
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {assigned.courses.map((course) => (
                <CourseCard
                  key={course.assignmentId}
                  {...course}
                  section="assigned"
                  onAction={(action) => {
                    if (action === "accept") {
                      handleAccept(course.assignmentId);
                    } else if (action === "decline") {
                      handleDecline(course.assignmentId);
                    }
                  }}
                  loading={actionLoading === course.assignmentId}
                />
              ))}
            </div>
            <Pagination
              currentPage={assigned.pagination.page}
              totalPages={assigned.pagination.pages}
              onPageChange={(page) => fetchAssignedCourses(page)}
              loading={assigned.loading}
            />
          </>
        )}
      </section>

      {/* Learning Pathway Section */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <SectionHeader
          title="🚀 Learning Pathway"
          description="Courses you're actively learning"
          count={enrolled.pagination.total}
        />

        {enrolled.error && !enrolled.loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-red-800 font-medium">{enrolled.error}</p>
              <button
                onClick={() => fetchEnrolledCourses(enrolled.pagination.page)}
                className="text-red-600 hover:text-red-700 text-sm mt-1 underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {enrolled.loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-200 rounded-lg h-96 animate-pulse"
              />
            ))}
          </div>
        ) : enrolled.courses.length === 0 ? (
          <EmptyState
            section="enrolled"
            hasFilters={false}
            onBrowse={() => {
              // Scroll to discover section
              document
                .querySelector('[data-section="discover"]')
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {enrolled.courses.map((course) => (
                <CourseCard
                  key={course.enrollmentId}
                  {...course}
                  section="enrolled"
                  onAction={() => {
                    // Navigate to course
                    window.location.href = `/courses/${course.id}`;
                  }}
                />
              ))}
            </div>
            <Pagination
              currentPage={enrolled.pagination.page}
              totalPages={enrolled.pagination.pages}
              onPageChange={(page) => fetchEnrolledCourses(page)}
              loading={enrolled.loading}
            />
          </>
        )}
      </section>
    </div>
  );
};
