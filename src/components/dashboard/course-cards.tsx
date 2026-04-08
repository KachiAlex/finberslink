"use client";

import React from "react";
import Link from "next/link";
import { 
  PlayCircle, 
  Clock, 
  Users, 
  Calendar, 
  Award, 
  TrendingUp, 
  Star,
  ArrowRight,
  BookOpen,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

// Base course interface
interface BaseCourse {
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
}

// Learning Pathway Course
export interface LearningPathwayCourse extends BaseCourse {
  progress: number;
  lastAccessed?: Date;
  nextLesson?: string;
  timeSpent: number;
  streak: number;
  achievements: number;
  status: "in-progress" | "completed" | "not-started";
}

// Assigned Course
export interface AssignedCourse extends BaseCourse {
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
    liveSessions?: Array<{
      title: string;
      date: Date;
      duration: number;
    }>;
  };
  progress: number;
  priority: "high" | "medium" | "low";
}

// Discoverable Course
export interface DiscoverableCourse extends BaseCourse {
  description: string;
  duration: number;
  format: string;
  level: "beginner" | "intermediate" | "advanced";
  rating: number;
  reviewCount: number;
  enrollmentCount: number;
  prerequisites?: string[];
  outcomes?: string[];
  coverImage?: string;
  price?: number;
  certificateAvailable?: boolean;
}

// Learning Pathway Card Component
export function LearningPathwayCard({ course }: { course: LearningPathwayCourse }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-700";
      case "in-progress": return "bg-blue-100 text-blue-700";
      case "not-started": return "bg-slate-100 text-slate-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "bg-green-500";
    if (progress >= 50) return "bg-blue-500";
    if (progress >= 25) return "bg-amber-500";
    return "bg-slate-400";
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <GlassCard className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Progress Bar Top */}
      <div className="h-1 bg-slate-100 overflow-hidden">
        <div
          className={cn("h-full transition-all duration-500", getProgressColor(course.progress))}
          style={{ width: `${course.progress}%` }}
        />
      </div>

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-slate-900 group-hover:text-green-600 transition-colors line-clamp-2">
              {course.title}
            </h3>
            <Badge className={cn("shrink-0", getStatusColor(course.status))}>
              {course.status.replace("-", " ")}
            </Badge>
          </div>
          {course.tagline && (
            <p className="text-sm text-slate-600 line-clamp-2">{course.tagline}</p>
          )}
        </div>

        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-700">Progress</span>
            <span className="text-sm font-bold text-slate-900">{course.progress}%</span>
          </div>
          <Progress value={course.progress} className="h-2" />
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-600">{course.progress}%</div>
              <div className="text-xs text-green-700">Complete</div>
            </div>
            <div className="p-2 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue-600">{formatTime(course.timeSpent)}</div>
              <div className="text-xs text-blue-700">Time Spent</div>
            </div>
            <div className="p-2 bg-amber-50 rounded">
              <div className="text-lg font-bold text-amber-600">{course.streak}</div>
              <div className="text-xs text-amber-700">Day Streak</div>
            </div>
          </div>
        </div>

        {/* Next Lesson */}
        {course.nextLesson && (
          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
            <PlayCircle className="h-4 w-4 text-slate-600" />
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-900">Next Lesson</div>
              <div className="text-xs text-slate-600 truncate">{course.nextLesson}</div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </div>
        )}

        {/* Achievements */}
        {course.achievements > 0 && (
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-slate-600">
              {course.achievements} achievement{course.achievements !== 1 ? "s" : ""} earned
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button asChild size="sm" className="flex-1">
            <Link href={`/courses/${course.id}`}>
              {course.status === "completed" ? "Review" : "Continue Learning"}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={`/courses/${course.id}/progress`}>
              Progress
            </Link>
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}

// Assigned Course Card Component
export function AssignedCourseCard({ course }: { course: AssignedCourse | any }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700 border-red-200";
      case "medium": return "bg-amber-100 text-amber-700 border-amber-200";
      case "low": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // Handle both cohort-based and flat course structures
  const cohort = course.cohort || {
    name: "Cohort",
    startDate: course.assignedAt || new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days from now
    instructor: course.instructor || { id: "", name: "Instructor", avatar: null },
    classmates: [],
    deadlines: [],
  };

  const daysUntilEnd = Math.ceil((new Date(cohort.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isEndingSoon = daysUntilEnd <= 7;

  return (
    <GlassCard className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Priority Indicator */}
      <div className={cn("h-1", getPriorityColor(course.priority).split(" ")[0])} />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
              {course.title}
            </h3>
            <Badge className={cn("shrink-0", getPriorityColor(course.priority))}>
              {course.priority} priority
            </Badge>
          </div>
          
          {/* Cohort Info */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="font-medium text-blue-900">{cohort.name}</div>
            <div className="text-sm text-blue-700">
              {new Date(cohort.startDate).toLocaleDateString()} - {new Date(cohort.endDate).toLocaleDateString()}
              {isEndingSoon && (
                <span className="ml-2 text-red-600 font-medium">
                  ({daysUntilEnd} days left!)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Instructor & Classmates */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900">{cohort.instructor.name}</div>
                <div className="text-xs text-slate-600">Instructor</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-auto">
              <Users className="h-4 w-4 text-slate-600" />
              <span className="text-sm text-slate-600">
                {cohort.classmates.length} classmates
              </span>
            </div>
          </div>

          {/* Classmate Avatars */}
          <div className="flex items-center gap-1">
            {cohort.classmates.slice(0, 5).map((classmate, index) => (
              <div
                key={classmate.id}
                className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs"
                title={classmate.name}
              >
                {classmate.name.charAt(0)}
              </div>
            ))}
            {cohort.classmates.length > 5 && (
              <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs text-slate-600">
                +{cohort.classmates.length - 5}
              </div>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-700">Your Progress</span>
            <span className="text-sm font-bold text-slate-900">{course.progress}%</span>
          </div>
          <Progress value={course.progress} className="h-2" />
        </div>

        {/* Upcoming Deadlines */}
        {cohort.deadlines && cohort.deadlines.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-700">Upcoming Deadlines</div>
            {cohort.deadlines.slice(0, 2).map((deadline, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded">
                <Calendar className="h-4 w-4 text-red-600" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-red-900">{deadline.title}</div>
                  <div className="text-xs text-red-700">
                    {new Date(deadline.date).toLocaleDateString()}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs border-red-200 text-red-700">
                  {deadline.type}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button asChild size="sm" className="flex-1">
            <Link href={`/courses/${course.id}`}>
              Continue Learning
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={`/courses/${course.id}/cohort`}>
              View Cohort
            </Link>
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}

// Discoverable Course Card Component
export function DiscoverableCourseCard({ course, onEnroll }: { 
  course: DiscoverableCourse; 
  onEnroll?: (courseId: string) => Promise<void>;
}) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case "beginner": return "bg-green-100 text-green-700";
      case "intermediate": return "bg-blue-100 text-blue-700";
      case "advanced": return "bg-purple-100 text-purple-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? "s" : ""}`;
    }
    return `${minutes} minutes`;
  };

  return (
    <GlassCard className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Course Image */}
      {course.coverImage && (
        <div className="h-48 bg-slate-100 relative overflow-hidden">
          <img
            src={course.coverImage}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {course.certificateAvailable && (
            <Badge className="absolute top-3 right-3 bg-green-600 text-white">
              Certificate
            </Badge>
          )}
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-slate-900 group-hover:text-yellow-600 transition-colors line-clamp-2">
              {course.title}
            </h3>
            <Badge className={cn("shrink-0", getLevelColor(course.level))}>
              {course.level}
            </Badge>
          </div>
          
          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4",
                    i < Math.floor(course.rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                  )}
                />
              ))}
            </div>
            <span className="text-sm text-slate-600">
              {course.rating.toFixed(1)} ({course.reviewCount} reviews)
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-600 line-clamp-3">{course.description}</p>

        {/* Course Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-600" />
            <span className="text-slate-700">{formatDuration(course.duration)}</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-slate-600" />
            <span className="text-slate-700">{course.format}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-600" />
            <span className="text-slate-700">{course.enrollmentCount} enrolled</span>
          </div>
          {course.price !== undefined && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-green-600">
                {course.price === 0 ? "Free" : `$${course.price}`}
              </span>
            </div>
          )}
        </div>

        {/* Instructor */}
        {course.instructor && (
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-900">{course.instructor.name}</div>
              <div className="text-xs text-slate-600">Instructor</div>
            </div>
          </div>
        )}

        {/* Prerequisites */}
        {course.prerequisites && course.prerequisites.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-700">Prerequisites</div>
            <div className="flex flex-wrap gap-1">
              {course.prerequisites.slice(0, 3).map((prereq, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {prereq}
                </Badge>
              ))}
              {course.prerequisites.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{course.prerequisites.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Outcomes */}
        {course.outcomes && course.outcomes.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-700">What you'll learn</div>
            <ul className="text-sm text-slate-600 space-y-1">
              {course.outcomes.slice(0, 3).map((outcome, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-slate-400 rounded-full mt-2 shrink-0" />
                  <span className="line-clamp-1">{outcome}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => onEnroll?.(course.id)}
          >
            {course.price === 0 ? "Enroll Free" : "Enroll Now"}
          </Button>
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={`/courses/${course.id}/preview`}>
              Preview
            </Link>
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}
