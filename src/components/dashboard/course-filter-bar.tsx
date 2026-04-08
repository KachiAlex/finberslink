"use client";

import React, { useState } from "react";
import { Search, Filter, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface CourseFilters {
  search: string;
  category: string;
  progress: "all" | "in-progress" | "completed" | "not-started";
  status: "active" | "upcoming" | "archived";
  dateRange: "recent" | "newest" | "oldest";
}

interface CourseFilterBarProps {
  filters: CourseFilters;
  onFiltersChange: (filters: CourseFilters) => void;
  categories: string[];
  courseCount: number;
}

const progressOptions = [
  { value: "all", label: "All Progress" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "not-started", label: "Not Started" },
] as const;

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "upcoming", label: "Upcoming" },
  { value: "archived", label: "Archived" },
] as const;

const dateOptions = [
  { value: "recent", label: "Recently Accessed" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
] as const;

export function CourseFilterBar({ 
  filters, 
  onFiltersChange, 
  categories,
  courseCount 
}: CourseFilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const hasActiveFilters = 
    filters.search || 
    filters.category || 
    filters.progress !== "all" || 
    filters.status !== "active" || 
    filters.dateRange !== "recent";

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      category: "",
      progress: "all",
      status: "active",
      dateRange: "recent",
    });
    setShowAdvanced(false);
  };

  const updateFilter = (key: keyof CourseFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search courses by name, instructor, or topic..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-10 pr-4"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateFilter("search", "")}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            "gap-2",
            showAdvanced && "bg-blue-50 border-blue-200 text-blue-700"
          )}
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <Badge className="h-5 w-5 p-0 bg-blue-600 text-white" />
          )}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} className="text-slate-600">
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
          {/* Category Filter */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => updateFilter("category", filters.category === category ? "" : category)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-all",
                    filters.category === category
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Progress Filter */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Progress</label>
            <div className="flex flex-wrap gap-2">
              {progressOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateFilter("progress", option.value)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-all",
                    filters.progress === option.value
                      ? "bg-green-600 text-white"
                      : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status and Date Filters */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">Status</label>
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setActiveDropdown(activeDropdown === "status" ? null : "status")}
                  className="w-full justify-between"
                >
                  {statusOptions.find(opt => opt.value === filters.status)?.label}
                  <ChevronDown className="h-4 w-4" />
                </Button>
                {activeDropdown === "status" && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          updateFilter("status", option.value);
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">Sort By</label>
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setActiveDropdown(activeDropdown === "date" ? null : "date")}
                  className="w-full justify-between"
                >
                  {dateOptions.find(opt => opt.value === filters.dateRange)?.label}
                  <ChevronDown className="h-4 w-4" />
                </Button>
                {activeDropdown === "date" && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                    {dateOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          updateFilter("dateRange", option.value);
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="pt-2 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Showing {courseCount} course{courseCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
