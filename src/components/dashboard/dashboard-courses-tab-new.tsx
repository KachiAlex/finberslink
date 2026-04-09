"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Users, Compass, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { CourseFilterBar, CourseFilters } from "@/components/dashboard/course-filter-bar";
import CourseSwitchTabs, { CourseTab } from "@/components/dashboard/course-switch-tabs";
import { 
  LearningPathwayCard, 
  AssignedCourseCard, 
  DiscoverableCourseCard 
} from "@/components/dashboard/course-cards";
import { cn } from "@/lib/utils";

// Types for course data
interface LearningPathwayCourse {
  id: string;
  title: string;
  slug?: string;
  tagline?: string;
  level?: string;
  instructor?: {
    id: string;
    name: string;
    avatar?: string;
  };
  progress: number;
  lastAccessed?: Date;
  nextLesson?: string;
  timeSpent: number;
  streak: number;
  achievements: number;
  status: "in-progress" | "completed" | "not-started";
  category?: string;
  createdAt: Date;
}

interface AssignedCourse {
  id: string;
  title: string;
  slug?: string;
  tagline?: string;
  level?: string;
  instructor?: {
    id: string;
    name: string;
    avatar?: string;
  };
  cohort: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    instructor: {
      id: string;
      name: string;
      avatar?: string;
      email?: string;
    };
    classmates: Array<{
      id: string;
      name: string;
      avatar?: string;
    }>;
    deadlines?: Array<{
      title: string;
      date: Date;
      type: "assignment" | "exam" | "project";
    }>;
  };
  progress: number;
  priority: "high" | "medium" | "low";
  category?: string;
  assignedAt: Date;
  assignedBy: string;
}

interface DiscoverableCourse {
  id: string;
  title: string;
  slug?: string;
  description: string;
  tagline?: string;
  level: "beginner" | "intermediate" | "advanced";
  instructor?: {
    id: string;
    name: string;
    avatar?: string;
  };
  duration: number;
  format: string;
  rating: number;
  reviewCount: number;
  enrollmentCount: number;
  prerequisites?: string[];
  outcomes?: string[];
  coverImage?: string;
  price?: number;
  certificateAvailable?: boolean;
  category?: string;
  publishedAt?: Date;
}

interface DashboardCoursesTabProps {
  assigned?: any[];
  initialCatalog?: any[];
  initialPagination?: any;
  initialFilters?: any;
  loading?: boolean;
}

export function DashboardCoursesTab({ 
  assigned = [],
  initialCatalog = [],
  initialPagination = {},
  initialFilters = {},
  loading = false 
}: DashboardCoursesTabProps) {
  return (
    <Suspense fallback={<DashboardCoursesTabSkeleton />}>
      <DashboardCoursesTabContent
        assigned={assigned}
        initialCatalog={initialCatalog}
        initialPagination={initialPagination}
        initialFilters={initialFilters}
        loading={loading}
      />
    </Suspense>
  );
}

function DashboardCoursesTabSkeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="h-12 bg-slate-200 rounded" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-200 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardCoursesTabContent({ 
  assigned = [],
  initialCatalog = [],
  initialPagination = {},
  initialFilters = {},
  loading = false 
}: DashboardCoursesTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize tab from URL or default to learning-pathway
  const urlTab = (searchParams.get("tab") as CourseTab) || "learning-pathway";
  const [activeTab, setActiveTab] = useState<CourseTab>(urlTab);
  
  const [filters, setFilters] = useState<CourseFilters>({
    search: initialFilters?.search || "",
    category: initialFilters?.category || "",
    progress: "all",
    status: "active",
    dateRange: "recent",
  });

  // State for different course types
  const [learningPathwayCourses, setLearningPathwayCourses] = useState<LearningPathwayCourse[]>([]);
  const [assignedCourses, setAssignedCourses] = useState<AssignedCourse[]>([]);
  const [discoverableCourses, setDiscoverableCourses] = useState<DiscoverableCourse[]>([]);

  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    learningPathway: false,
    assigned: false,
    discover: false,
  });

  // Error states
  const [errors, setErrors] = useState({
    learningPathway: null,
    assigned: null,
    discover: null,
  });

  // Tab counts
  const [tabCounts, setTabCounts] = useState<Record<CourseTab, number>>({
    "learning-pathway": 0,
    "assigned": 0,
    "discover": 0,
  });

  // Categories for filtering
  const [categories, setCategories] = useState<string[]>([]);

  // Enrollment handler
  const handleEnroll = async (courseId: string) => {
    try {
      console.log(`Enrolling in course: ${courseId}`);
      
      const response = await fetch("/api/enrollments-working", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ courseId }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log("Successfully enrolled:", result);
        alert(`Successfully enrolled in ${result.course.title}! 🎉`);
        // Refresh the courses data to update the UI
        window.location.reload(); // Simple refresh for now
      } else {
        console.error("Enrollment failed:", result.error);
        alert(`Enrollment failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Enrollment error:", error);
      alert("Failed to enroll in course. Please try again.");
    }
  };

  // Debug logging
  React.useEffect(() => {
    console.log("DashboardCoursesTab mounted with props:", { assigned, initialCatalog, initialPagination, initialFilters, loading });
  }, [assigned, initialCatalog, initialPagination, initialFilters, loading]);

  // Fetch courses based on active tab
  useEffect(() => {
    const fetchCourses = async () => {
      console.log(`Fetching courses for tab: ${activeTab}`);
      setLoadingStates(prev => ({ ...prev, [activeTab]: true }));
      setErrors(prev => ({ ...prev, [activeTab]: null }));

      try {
        // Use real APIs only - no mock data
        let url = `/api/dashboard/courses/${activeTab}`;
        const params = new URLSearchParams();

        // Add filters based on tab
        if (activeTab === "learning-pathway") {
          params.append("search", filters.search);
          params.append("category", filters.category);
          params.append("progress", filters.progress);
          params.append("status", filters.status);
          params.append("dateRange", filters.dateRange);
        } else if (activeTab === "assigned") {
          params.append("search", filters.search);
          params.append("category", filters.category);
          params.append("progress", filters.progress);
          params.append("priority", "all");
        } else if (activeTab === "discover") {
          params.append("search", filters.search);
          params.append("category", filters.category);
          params.append("level", (filters as any).level || "");
          params.append("format", (filters as any).format || "");
          params.append("price", "all");
          params.append("rating", "0");
        }

        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        console.log(`Making request to: ${url}`);

        const response = await fetch(url + (params.toString() ? `?${params.toString()}` : ""), {
          credentials: "include",
        });

        if (!response.ok) {
          console.error(`Failed to fetch ${activeTab} courses:`, response.status);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`Received data for ${activeTab}:`, result);

        if (activeTab === "learning-pathway") {
          setLearningPathwayCourses(result.data);
          setTabCounts(prev => ({ ...prev, "learning-pathway": result.counts.total }));
          
          // Extract categories
          const uniqueCategories = [...new Set(result.data.map((c: any) => c.category).filter(Boolean))] as string[];
          setCategories(uniqueCategories);
        } else if (activeTab === "assigned") {
          setAssignedCourses(result.data);
          setTabCounts(prev => ({ ...prev, "assigned": result.counts.total }));
        } else if (activeTab === "discover") {
          setDiscoverableCourses(result.data);
          setTabCounts(prev => ({ ...prev, "discover": result.counts.total }));
        }
      } catch (error) {
        console.error(`Error fetching ${activeTab} courses:`, error);
        setErrors(prev => ({ ...prev, [activeTab]: error as any }));
      } finally {
        setLoadingStates(prev => ({ ...prev, [activeTab]: false }));
      }
    };

    fetchCourses();
  }, [activeTab, filters]);

  // Get current courses based on active tab
  const currentCourses = useMemo(() => {
    switch (activeTab) {
      case "learning-pathway":
        return learningPathwayCourses;
      case "assigned":
        return assignedCourses;
      case "discover":
        return discoverableCourses;
      default:
        return [];
    }
  }, [activeTab, learningPathwayCourses, assignedCourses, discoverableCourses]);

  const currentLoading = loadingStates[activeTab];
  const currentError = errors[activeTab];

  // Handle tab change
  const handleTabChange = (tab: CourseTab) => {
    setActiveTab(tab);
    // Update URL to persist tab selection
    router.push(`?tab=${tab}`, { scroll: false });
    // Reset filters when switching tabs (except search)
    setFilters(prev => ({
      ...prev,
      category: "",
      progress: "all",
      status: "active",
      dateRange: "recent",
    }));
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: CourseFilters) => {
    setFilters(newFilters);
  };

  // Render loading state
  if (currentLoading) {
    console.log("Rendering loading state for tab:", activeTab);
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-12 bg-slate-200 rounded" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-slate-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (currentError) {
    console.log("Rendering error state for tab:", activeTab, currentError);
    return (
      <GlassCard className="p-8 text-center">
        <div className="text-slate-600">
          <p className="font-medium">Failed to load courses</p>
          <p className="text-sm mt-1">Please try again later</p>
        </div>
      </GlassCard>
    );
  }

  console.log("Rendering main content for tab:", activeTab, "with", currentCourses.length, "courses");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Courses Hub</h2>
            <p className="text-sm text-slate-600 mt-1">
              Manage your learning journey and explore new opportunities
            </p>
          </div>
          <Button asChild className="rounded-lg">
            <Link href="/dashboard/courses">
              Browse All Courses <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <CourseFilterBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        categories={categories}
        courseCount={currentCourses.length}
      />

      {/* Switch Tabs */}
      <CourseSwitchTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabCounts={tabCounts}
      />

      {/* Course Content */}
      {currentCourses.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-4">
            {activeTab === "learning-pathway" && <BookOpen className="h-6 w-6 text-slate-600" />}
            {activeTab === "assigned" && <Users className="h-6 w-6 text-slate-600" />}
            {activeTab === "discover" && <Compass className="h-6 w-6 text-slate-600" />}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">
              {activeTab === "learning-pathway" && "No enrolled courses yet"}
              {activeTab === "assigned" && "No assigned cohorts"}
              {activeTab === "discover" && "No courses found"}
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              {activeTab === "learning-pathway" && "Start your learning journey by enrolling in a course"}
              {activeTab === "assigned" && "You haven't been assigned to any cohorts yet"}
              {activeTab === "discover" && "Try adjusting your filters to find more courses"}
            </p>
            {activeTab === "discover" && (
              <Button asChild className="w-full">
                <Link href="/dashboard/courses">Browse All Courses</Link>
              </Button>
            )}
          </div>
        </GlassCard>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {currentCourses.map((course) => {
            if (activeTab === "learning-pathway") {
              return (
                <LearningPathwayCard
                  key={course.id}
                  course={course as LearningPathwayCourse}
                />
              );
            } else if (activeTab === "assigned") {
              return (
                <AssignedCourseCard
                  key={course.id}
                  course={course as AssignedCourse}
                />
              );
            } else if (activeTab === "discover") {
              return (
                <DiscoverableCourseCard
                  key={course.id}
                  course={course as DiscoverableCourse}
                  onEnroll={handleEnroll}
                />
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Load More Button for Discover Tab */}
      {activeTab === "discover" && currentCourses.length > 0 && (
        <div className="text-center">
          <Button variant="outline" className="rounded-lg">
            Load More Courses
          </Button>
        </div>
      )}
    </div>
  );
}
