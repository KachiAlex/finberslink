"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, Edit, Archive, Users, Eye, BarChart3 } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string | null;
  tagline: string | null;
  category: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  coverImage: string | null;
  instructorId: string;
  instructor: {
    firstName: string;
    lastName: string;
    email: string;
  };
  approvalStatus: 'PENDING' | 'APPROVED' | 'CHANGES' | 'DRAFT';
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  _count?: {
    enrollments: number;
  };
  hasPendingEdit?: boolean;
}

interface CourseCardProps {
  course: Course;
  onEdit?: (course: Course) => void;
  onView?: (course: Course) => void;
  onArchive?: (course: Course) => void;
  onRestore?: (course: Course) => void;
}

export function CourseCard({ course, onEdit, onView, onArchive, onRestore }: CourseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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
    <Card className="hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {getStatusBadge(course.approvalStatus)}
              {course.archivedAt && (
                <Badge variant="outline" className="ml-2 text-rose-600 border-rose-200">
                  Archived
                </Badge>
              )}
              {course.hasPendingEdit && (
                <Badge variant="outline" className="ml-2 text-violet-600 border-violet-200">
                  Pending Edit
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg font-semibold text-slate-900 leading-tight line-clamp-2">
              {course.title}
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
              {course.tagline || course.description || 'No description available'}
            </p>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Course Preview */}
        <div className="flex gap-4 mb-4">
          <SafeImage
            src={course.coverImage}
            alt={course.title}
            className="rounded-lg flex-shrink-0"
            width={96}
            height={64}
            fallback="/finbers-logo.png"
          />
          
          <div className="flex-1 min-w-0">
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <Users className="h-4 w-4" />
                <span>{course.instructor.firstName} {course.instructor.lastName}</span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <BarChart3 className="h-4 w-4" />
                <span>{course._count?.enrollments || 0} enrollments</span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span className="font-medium">Level:</span>
                <span className="ml-1 capitalize">{course.level?.toLowerCase()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expandable Details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-slate-700">Category:</span>
                <span className="ml-2 text-slate-600">{course.category}</span>
              </div>
              
              <div>
                <span className="font-medium text-slate-700">Created:</span>
                <span className="ml-2 text-slate-600">
                  {new Date(course.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div>
                <span className="font-medium text-slate-700">Updated:</span>
                <span className="ml-2 text-slate-600">
                  {new Date(course.updatedAt).toLocaleDateString()}
                </span>
              </div>
              
              <div>
                <span className="font-medium text-slate-700">Status:</span>
                <span className="ml-2 text-slate-600 capitalize">{course.approvalStatus}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewCourse(course)}
            className="flex-1 border-black text-black hover:bg-black hover:text-white"
          >
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={() => onEdit?.(course)}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          
          {(course.approvalStatus === 'APPROVED' && !course.archivedAt) && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onArchive?.(course)}
              className="flex-1"
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
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              <Archive className="h-4 w-4 mr-2" />
              Restore
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
