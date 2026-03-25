"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Zap, Award, Clock, BarChart3, ArrowRight, Filter, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { ProgressRing } from "@/components/ui/progress-ring";

interface Course {
  id: string;
  title: string;
  slug?: string | null;
  level?: string | null;
  tagline?: string | null;
  progress?: number | null;
  progressPercentage?: number | null;
  status?: string | null;
}

interface DashboardCoursesTabProps {
  courses: Course[];
  loading?: boolean;
}

const getLevelColor = (level?: string | null) => {
  if (!level) return "bg-slate-100 text-slate-700";
  const levelLower = level.toLowerCase();
  if (levelLower.includes("beginner")) return "bg-emerald-100 text-emerald-700";
  if (levelLower.includes("intermediate")) return "bg-blue-100 text-blue-700";
  if (levelLower.includes("advanced")) return "bg-purple-100 text-purple-700";
  return "bg-slate-100 text-slate-700";
};

const getProgressVariant = (progress: number) => {
  if (progress >= 75) return "emerald";
  if (progress >= 50) return "blue";
  if (progress >= 25) return "amber";
  return "slate";
};

const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
      <div className="h-4 bg-slate-200 rounded w-3/4" />
      <div className="h-3 bg-slate-200 rounded w-1/2" />
      <div className="h-2 bg-slate-200 rounded w-full" />
      <div className="flex gap-2">
        <div className="h-8 bg-slate-200 rounded flex-1" />
        <div className="h-8 bg-slate-200 rounded flex-1" />
      </div>
    </div>
  </div>
);

export function DashboardCoursesTab({ courses, loading = false }: DashboardCoursesTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLevel = !levelFilter || course.level?.toLowerCase().includes(levelFilter.toLowerCase());
      return matchesSearch && matchesLevel;
    });
  }, [courses, searchQuery, levelFilter]);

  const stats = useMemo(() => {
    if (courses.length === 0) return { completed: 0, inProgress: 0, notStarted: 0, avgProgress: 0 };

    const completed = courses.filter((c) => (c.progress ?? c.progressPercentage ?? 0) >= 100).length;
    const inProgress = courses.filter((c) => {
      const p = (c.progress ?? c.progressPercentage ?? 0);
      return p > 0 && p < 100;
    }).length;
    const notStarted = courses.filter((c) => (c.progress ?? c.progressPercentage ?? 0) === 0).length;
    const avgProgress = courses.length > 0
      ? Math.round(courses.reduce((acc, c) => acc + (c.progress ?? c.progressPercentage ?? 0), 0) / courses.length)
      : 0;

    return { completed, inProgress, notStarted, avgProgress };
  }, [courses]);

  const levelOptions = useMemo(() => {
    const levels = new Set(courses.map((c) => c.level).filter(Boolean) as string[]);
    return Array.from(levels).sort();
  }, [courses]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setLevelFilter(null);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 bg-slate-200 rounded w-1/2 animate-pulse" />
              <div className="h-6 bg-slate-200 rounded animate-pulse" />
              <div className="h-2 bg-slate-200 rounded w-3/4 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Learning Path</h2>
            <p className="text-sm text-slate-600 mt-1">
              {courses.length === 0 ? "No courses yet. Start your learning journey!" : `${courses.length} course${courses.length !== 1 ? "s" : ""} enrolled`}
            </p>
          </div>
          <Button asChild className="rounded-lg">
            <Link href="/dashboard/courses">
              Explore More <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        {courses.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <GlassCard className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Completed</p>
                  <p className="text-2xl font-bold text-emerald-900 mt-1">{stats.completed}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {stats.completed === 1 ? "course" : "courses"} finished
                  </p>
                </div>
                <Award className="w-8 h-8 text-emerald-600 opacity-40" />
              </div>
            </GlassCard>

            <GlassCard className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">In Progress</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{stats.inProgress}</p>
                  <p className="text-xs text-slate-600 mt-1">actively learning</p>
                </div>
                <Zap className="w-8 h-8 text-blue-600 opacity-40" />
              </div>
            </GlassCard>

            <GlassCard className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Not Started</p>
                  <p className="text-2xl font-bold text-amber-900 mt-1">{stats.notStarted}</p>
                  <p className="text-xs text-slate-600 mt-1">upcoming courses</p>
                </div>
                <Clock className="w-8 h-8 text-amber-600 opacity-40" />
              </div>
            </GlassCard>

            <GlassCard className="p-4 bg-gradient-to-br from-violet-50 to-violet-100/50">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Avg Progress</p>
                  <p className="text-2xl font-bold text-violet-900 mt-1">{stats.avgProgress}%</p>
                  <p className="text-xs text-slate-600 mt-1">overall completion</p>
                </div>
                <BarChart3 className="w-8 h-8 text-violet-600 opacity-40" />
              </div>
            </GlassCard>
          </div>
        )}
      </div>

      {courses.length === 0 ? (
        <GlassCard className="space-y-4 p-8 border-dashed text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <BookOpen className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">No courses yet</h3>
            <p className="text-sm text-slate-600 mt-1">
              Start learning by enrolling in a course from our catalog
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/dashboard/courses">Browse Courses</Link>
          </Button>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(showFilters && "bg-blue-50 border-blue-200")}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {showFilters && (
              <div className="space-y-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                {levelOptions.length > 0 && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-2">Level</label>
                    <div className="flex flex-wrap gap-2">
                      {levelOptions.map((level) => (
                        <button
                          key={level}
                          onClick={() => setLevelFilter(levelFilter === level ? null : level as string)}
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium transition-all",
                            levelFilter === level
                              ? "bg-blue-600 text-white"
                              : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
                          )}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(searchQuery || levelFilter) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full text-slate-600"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Courses List */}
          {filteredCourses.length === 0 ? (
            <GlassCard className="p-6 text-center">
              <p className="text-sm text-slate-600">No courses match your filters</p>
            </GlassCard>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => {
                const progress = course.progress ?? course.progressPercentage ?? 0;
                const variant = getProgressVariant(progress);

                return (
                  <div
                    key={course.id}
                    className="group relative rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    {/* Progress Bar Top */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-500",
                          variant === "emerald" && "bg-emerald-500",
                          variant === "blue" && "bg-blue-500",
                          variant === "amber" && "bg-amber-500",
                          variant === "slate" && "bg-slate-400"
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Title & Level */}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 pr-2">
                          {course.title}
                        </h3>
                        {course.level && (
                          <Badge className={cn("w-fit", getLevelColor(course.level))}>
                            {course.level}
                          </Badge>
                        )}
                      </div>

                      {/* Tagline */}
                      {course.tagline && (
                        <p className="text-xs text-slate-600 line-clamp-2">{course.tagline}</p>
                      )}

                      {/* Progress Ring & Stats */}
                      <div className="flex items-center justify-between py-2">
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-slate-600">Progress</span>
                            <span className="text-sm font-bold text-slate-900">{progress}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                variant === "emerald" && "bg-emerald-500",
                                variant === "blue" && "bg-blue-500",
                                variant === "amber" && "bg-amber-500",
                                variant === "slate" && "bg-slate-400"
                              )}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      {progress >= 100 ? (
                        <Badge className="w-full justify-center bg-emerald-100 text-emerald-700 rounded-lg py-1">
                          Completed
                        </Badge>
                      ) : progress > 0 ? (
                        <Badge className="w-full justify-center bg-blue-100 text-blue-700 rounded-lg py-1">
                          In Progress
                        </Badge>
                      ) : (
                        <Badge className="w-full justify-center bg-slate-100 text-slate-700 rounded-lg py-1">
                          Not Started
                        </Badge>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button asChild size="sm" className="flex-1 rounded-lg">
                          <Link href={`/courses/${course.id}`}>
                            {progress >= 100 ? "Review" : "Continue"}
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="flex-1 rounded-lg">
                          <Link href="/dashboard/courses">Details</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
