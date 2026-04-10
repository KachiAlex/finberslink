"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

interface Instructor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  level: string;
  category: string;
  coverImage: string;
  instructor: Instructor;
  section: "discover" | "assigned" | "enrolled";
  enrollmentCount?: number;
  rating?: number;
  progressPercentage?: number;
  lessonsCount?: number;
  lessonsCompleted?: number;
  assignedAt?: Date;
  assignedBy?: { firstName: string; lastName: string };
  status?: string;
  onAction: (action: string) => void;
  loading?: boolean;
}

const getLevelColor = (level: string) => {
  switch (level?.toLowerCase()) {
    case "beginner":
      return "bg-green-100 text-green-800";
    case "intermediate":
      return "bg-amber-100 text-amber-800";
    case "advanced":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const CourseCard: React.FC<CourseCardProps> = ({
  id,
  title,
  description,
  level,
  category,
  coverImage,
  instructor,
  section,
  enrollmentCount,
  rating,
  progressPercentage,
  lessonsCount = 0,
  lessonsCompleted = 0,
  assignedAt,
  assignedBy,
  status,
  onAction,
  loading = false,
}) => {
  const formatDate = (date: Date | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}m ago`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-102 overflow-hidden flex flex-col h-full">
      {/* Image Header */}
      <div className="relative h-40 bg-gray-200 overflow-hidden">
        <Image
          src={coverImage || "/placeholder-course.jpg"}
          alt={title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-medium ${getLevelColor(level)}`}>
          {level}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-lg text-slate-900 line-clamp-2 mb-2">
          {title}
        </h3>

        <p className="text-sm text-slate-600 line-clamp-2 mb-3">
          {description}
        </p>

        <div className="text-xs text-slate-500 mb-3">
          {category}
        </div>

        {/* Section-specific metadata */}
        {section === "discover" && (
          <div className="mb-3 space-y-1">
            <div className="text-sm text-slate-600">
              {enrollmentCount} enrolled
            </div>
            {rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm text-slate-600">{rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        )}

        {section === "assigned" && (
          <div className="mb-3 space-y-1 text-sm text-slate-600">
            <div>Assigned by: {assignedBy?.firstName} {assignedBy?.lastName}</div>
            <div>{formatDate(assignedAt)}</div>
          </div>
        )}

        {section === "enrolled" && (
          <div className="mb-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Progress</span>
              <span className="font-medium text-slate-900">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="text-xs text-slate-500">
              {lessonsCompleted}/{lessonsCount} lessons
            </div>
          </div>
        )}

        {/* Instructor */}
        <div className="text-sm text-slate-600 mb-4 mt-auto">
          By: {instructor.firstName} {instructor.lastName}
        </div>

        {/* Action Button */}
        <div className="flex gap-2">
          {section === "discover" && (
            <Button
              onClick={() => onAction("enroll")}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Enrolling..." : "Enroll"}
            </Button>
          )}

          {section === "assigned" && (
            <>
              <Button
                onClick={() => onAction("accept")}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loading ? "..." : "Accept"}
              </Button>
              <Button
                onClick={() => onAction("decline")}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                {loading ? "..." : "Decline"}
              </Button>
            </>
          )}

          {section === "enrolled" && (
            <Button
              onClick={() => onAction("continue")}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Loading..." : "Continue"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
