"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, Rocket } from "lucide-react";

interface EmptyStateProps {
  section: "discover" | "assigned" | "enrolled";
  hasFilters: boolean;
  onClearFilters?: () => void;
  onBrowse?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  section,
  hasFilters,
  onClearFilters,
  onBrowse,
}) => {
  if (section === "discover") {
    return (
      <div className="text-center py-12">
        <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          {hasFilters ? "No Courses Found" : "No Approved Courses"}
        </h3>
        <p className="text-slate-600 mb-6">
          {hasFilters
            ? "No approved courses match your search criteria."
            : "No approved courses are available yet."}
        </p>
        {hasFilters && (
          <Button onClick={onClearFilters} variant="outline">
            Clear Filters
          </Button>
        )}
      </div>
    );
  }

  if (section === "assigned") {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          No Assigned Courses
        </h3>
        <p className="text-slate-600 mb-6">
          Your administrator hasn't assigned any courses yet.
        </p>
        <Button onClick={onBrowse} className="bg-blue-600 hover:bg-blue-700">
          Browse Discover
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <Rocket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        Start Your Learning Path
      </h3>
      <p className="text-slate-600 mb-6">
        You haven't enrolled in any courses yet.
      </p>
      <Button onClick={onBrowse} className="bg-blue-600 hover:bg-blue-700">
        Browse Discover
      </Button>
    </div>
  );
};
