"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { CourseListRow } from "./course-list-row";
import { 
  Search, 
  Filter, 
  Users, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Archive,
  RefreshCw,
  Plus
} from "lucide-react";
import type { CourseApprovalStatus, CourseLevel } from "@prisma/client";

// Lazy load the modal component to avoid SSR issues with lucide-react icons
const CourseEditModalEnhanced = lazy(() => import("./course-edit-modal-enhanced").then(mod => ({ default: mod.CourseEditModalEnhanced })));

// Define Course type locally
interface Course {
  id: string;
  title: string;
  description: string | null;
  tagline: string | null;
  category: string;
  level: CourseLevel;
  coverImage: string | null;
  instructorId: string;
  instructor: {
    firstName: string;
    lastName: string;
    email: string;
  };
  approvalStatus: CourseApprovalStatus;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  _count?: {
    enrollments: number;
  };
  hasPendingEdit?: boolean;
}

interface CourseStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  pendingCourses: number;
  archivedCourses: number;
}

export function AdminCoursesGrid() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [archivedCourses, setArchivedCourses] = useState<Course[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [stats, setStats] = useState<CourseStats>({
    totalCourses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    pendingCourses: 0,
    archivedCourses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list">("list");
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch courses
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/courses');
      const data = await response.json();
      
      if (data.success && data.allCourses) {
        // Separate live and archived courses
        const live = data.allCourses.filter((course: Course) => !course.archivedAt);
        const archived = data.allCourses.filter((course: Course) => course.archivedAt);
        
        setCourses(live);
        setArchivedCourses(archived);
        
        // Calculate stats
        const newStats: CourseStats = {
          totalCourses: data.allCourses.length,
          publishedCourses: live.filter((c: Course) => c.approvalStatus === 'APPROVED').length,
          draftCourses: live.filter((c: Course) => c.approvalStatus === 'DRAFT').length,
          pendingCourses: live.filter((c: Course) => c.approvalStatus === 'PENDING').length,
          archivedCourses: archived.length,
        };
        setStats(newStats);
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${course.instructor.firstName} ${course.instructor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || course.approvalStatus === selectedStatus;
    const matchesCategory = selectedCategory === "all" || course.category === selectedCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleViewCourse = (course: Course) => {
    // Open course in new tab or navigate to course page
    window.open(`/courses/${course.id}`, '_blank');
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setIsEditModalOpen(true);
  };

  const handleSaveCourse = async (updatedData: Partial<Course>) => {
    try {
      console.log('Saving course with data:', updatedData);
      
      let response;
      let result;
      
      if (editingCourse) {
        // Update existing course
        response = await fetch(`/api/admin/courses/${editingCourse.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData)
        });
      } else {
        // Create new course
        response = await fetch('/api/admin/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData)
        });
      }
      
      result = await response.json();
      console.log('Save response:', result);
      
      if (response.ok && result.success) {
        await fetchCourses(); // Refresh data
        setIsEditModalOpen(false);
        setEditingCourse(null);
        return true; // Return success
      } else {
        console.error('Save failed:', result.error);
        return false; // Return failure
      }
    } catch (error) {
      console.error('Error saving course:', error);
      return false; // Return failure
    }
  };

  const handleArchiveCourse = async (course: Course) => {
    if (confirm(`Are you sure you want to archive "${course.title}"? This will remove it from the live catalog and move it to archived courses.`)) {
      try {
        const response = await fetch(`/api/admin/courses/${course.id}/archive`, {
          method: 'POST'
        });
        
        if (response.ok) {
          // Remove from live courses and add to archived courses
          setCourses(prev => prev.filter(c => c.id !== course.id));
          setArchivedCourses(prev => [...prev, { ...course, archivedAt: new Date() }]);
          
          // Show success message
          alert(`"${course.title}" has been archived successfully.`);
        } else {
          throw new Error('Failed to archive course');
        }
      } catch (error) {
        console.error('Error archiving course:', error);
        alert('Failed to archive course. Please try again.');
      }
    }
  };

  const handleRestoreCourse = async (course: Course) => {
    if (confirm(`Are you sure you want to restore "${course.title}"? This will move it back to the live catalog.`)) {
      try {
        const response = await fetch(`/api/admin/courses/${course.id}/restore`, {
          method: 'POST'
        });
        
        if (response.ok) {
          // Remove from archived courses and add back to live courses
          setArchivedCourses(prev => prev.filter(c => c.id !== course.id));
          setCourses(prev => [...prev, { ...course, archivedAt: null }]);
          
          // Show success message
          alert(`"${course.title}" has been restored successfully.`);
        } else {
          throw new Error('Failed to restore course');
        }
      } catch (error) {
        console.error('Error restoring course:', error);
        alert('Failed to restore course. Please try again.');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'draft':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-slate-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalCourses}</p>
                <p className="text-sm text-slate-600">Total Courses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold">{stats.publishedCourses}</p>
                <p className="text-sm text-slate-600">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-2xl font-bold">{stats.pendingCourses}</p>
                <p className="text-sm text-slate-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-slate-600" />
              <div>
                <p className="text-2xl font-bold">{stats.draftCourses}</p>
                <p className="text-sm text-slate-600">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Archive className="h-5 w-5 text-rose-600" />
              <div>
                <p className="text-2xl font-bold">{stats.archivedCourses}</p>
                <p className="text-sm text-slate-600">Archived</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search courses, instructors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="DRAFT">Draft</option>
                <option value="CHANGES">Changes</option>
              </select>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-md text-sm"
              >
                <option value="all">All Categories</option>
                <option value="BUSINESS">Business</option>
                <option value="TECHNOLOGY">Technology</option>
                <option value="DESIGN">Design</option>
                <option value="MARKETING">Marketing</option>
                <option value="HEALTH">Health</option>
                <option value="EDUCATION">Education</option>
              </select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Course Grid */}
      <div className="space-y-6">
        {/* Live Courses */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Live Catalog ({filteredCourses.length})</h3>
            <Button
              onClick={() => {
                setEditingCourse(null);
                setIsEditModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Course
            </Button>
          </div>
          <div className="space-y-4">
            {filteredCourses.map((course) => (
              <CourseListRow
                key={course.id}
                course={course}
                onView={handleViewCourse}
                onEdit={handleEditCourse}
                onArchive={handleArchiveCourse}
                onRestore={handleRestoreCourse}
              />
            ))}
          </div>
          
          {filteredCourses.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-500">No courses found matching your criteria.</p>
            </div>
          )}
        </div>

        {/* Archived Courses */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Archived Courses ({archivedCourses.length})
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-2"
            >
              {showArchived ? 'Hide' : 'Show'} Archived
              <Archive className="h-4 w-4" />
            </Button>
          </div>
          
          {showArchived && archivedCourses.length > 0 && (
            <div className="space-y-4">
              {archivedCourses.map((course) => (
                <CourseListRow
                  key={course.id}
                  course={course}
                  onView={handleViewCourse}
                  onEdit={handleEditCourse}
                  onRestore={handleRestoreCourse}
                />
              ))}
            </div>
          )}
          
          {showArchived && archivedCourses.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-500">No archived courses.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <Suspense fallback={<div>Loading...</div>}>
          <CourseEditModalEnhanced
            course={editingCourse}
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingCourse(null);
            }}
            onSave={handleSaveCourse}
          />
        </Suspense>
      )}
    </div>
  );
}
