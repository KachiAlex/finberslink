"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, Edit, Archive, Users, Eye, BarChart3, Calendar, Clock } from "lucide-react";
import type { CourseApprovalStatus, CourseLevel } from "@prisma/client";

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

interface CourseListRowProps {
  course: Course;
  onEdit?: (course: Course) => void;
  onView?: (course: Course) => void;
  onArchive?: (course: Course) => void;
  onRestore?: (course: Course) => void;
}

export function CourseListRow({ course, onEdit, onView, onArchive, onRestore }: CourseListRowProps) {
  const { toast } = useToast();

  const handleViewCourse = (course: Course) => {
    // Show toast notification instead of logging out
    toast({
      title: "Please Sign in as Student",
      description: "To view this course, you need to sign in as a student. Current admin session will be preserved.",
      duration: 6000,
    });
    
    // Optionally, you can still call the original onView if needed
    // onView?.(course);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'changes':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'draft':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = getStatusColor(status);
    return (
      <Badge className={`${colors} text-xs font-medium`}>
        {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
      </Badge>
    );
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-center justify-between">
        {/* Course Info */}
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-center gap-3 mb-2">
            {getStatusBadge(course.approvalStatus)}
            {course.archivedAt && (
              <Badge variant="outline" className="text-rose-600 border-rose-200">
                Archived
              </Badge>
            )}
            {course.hasPendingEdit && (
              <Badge variant="outline" className="text-violet-600 border-violet-200">
                Pending Edit
              </Badge>
            )}
          </div>
          
          <div className="flex items-start gap-4">
            {/* Course Cover Image */}
            <SafeImage
              src={course.coverImage}
              alt={course.title}
              className="rounded-lg flex-shrink-0"
              width={64}
              height={64}
              fallback="/finbers-logo.png"
            />
            
            {/* Course Details */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                {course.title}
              </h3>
              <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                {course.tagline || course.description || 'No description available'}
              </p>
              
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{course.instructor.firstName} {course.instructor.lastName}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  <span>{course._count?.enrollments || 0} enrollments</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <span className="font-medium">Level:</span>
                  <span className="capitalize">{course.level?.toLowerCase()}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <span className="font-medium">Category:</span>
                  <span>{course.category}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 ml-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewCourse(course)}
              className="border-black text-black hover:bg-black hover:text-white"
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={() => onEdit?.(course)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            
            {(course.approvalStatus === 'APPROVED' && !course.archivedAt) && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onArchive?.(course)}
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button>
            )}
            
            {course.archivedAt && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onRestore?.(course)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Archive className="h-4 w-4 mr-2" />
                Restore
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(course.createdAt).toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{new Date(course.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
