"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgressRing } from "@/components/ui/progress-ring";
import { cn } from "@/lib/utils";
import { CourseCard } from "@/features/lms/components/course-card";
import type { CourseSummary } from "@/types/lms";

interface AssignedCourseCard {
  id: string;
  progress: number;
  course: {
    id: string;
    title: string;
    slug: string | null;
    level?: string | null;
    tagline?: string | null;
    category?: string | null;
  };
}

interface DashboardCoursesClientProps {
  assigned: AssignedCourseCard[];
  catalog: CourseSummary[];
}

const levelFilters = [
  { label: "All levels", value: "all" as const },
  { label: "Beginner", value: "beginner" as const },
  { label: "Intermediate", value: "intermediate" as const },
  { label: "Advanced", value: "advanced" as const },
];

type LevelFilter = typeof levelFilters[number]["value"] | "all";

export function DashboardCoursesClient({ assigned, catalog }: DashboardCoursesClientProps) {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<LevelFilter>("all");
  const [category, setCategory] = useState("all");

  const categories = useMemo(() => {
    const values = new Set<string>();
    [...assigned, ...catalog].forEach((card) => {
      const cat = "course" in card ? card.course.category : card.category;
      if (cat) values.add(cat);
    });
    return ["all", ...Array.from(values)];
  }, [assigned, catalog]);

  const normalizedSearch = search.trim().toLowerCase();

  const matchesSearch = (text: string | null | undefined) => {
    if (!normalizedSearch) return true;
    if (!text) return false;
    return text.toLowerCase().includes(normalizedSearch);
  };

  const assignedFiltered = useMemo(() => {
    return assigned.filter(({ course }) => {
      const levelMatch = level === "all" || (course.level?.toLowerCase() ?? "") === level;
      const categoryMatch = category === "all" || (course.category ?? "").toLowerCase() === category.toLowerCase();
      const searchMatch =
        matchesSearch(course.title) || matchesSearch(course.tagline) || matchesSearch(course.category);
      return levelMatch && categoryMatch && searchMatch;
    });
  }, [assigned, level, category, normalizedSearch]);

  const catalogFiltered = useMemo(() => {
    return catalog.filter((course) => {
      const levelMatch = level === "all" || course.level === level;
      const categoryMatch = category === "all" || course.category.toLowerCase() === category.toLowerCase();
      const searchMatch =
        matchesSearch(course.title) || matchesSearch(course.tagline) || matchesSearch(course.instructor.name);
      return levelMatch && categoryMatch && searchMatch;
    });
  }, [catalog, level, category, normalizedSearch]);

  const clearFilters = () => {
    setSearch("");
    setLevel("all");
    setCategory("all");
  };

  const filterActive = level !== "all" || category !== "all" || Boolean(normalizedSearch);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Filters</p>
            <h3 className="text-lg font-semibold text-slate-900">Tune the catalog</h3>
            <p className="text-sm text-slate-500">Search, filter by level, or zero-in on a category.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search courses"
                className="pl-9"
              />
            </div>
            {filterActive ? (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>
        </div>
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {levelFilters.map((option) => (
              <button
                key={option.value}
                onClick={() => setLevel(option.value)}
                className={cn(
                  "rounded-full border px-4 py-1 text-sm font-medium transition",
                  level === option.value
                    ? "border-slate-900 bg-slate-900 text-white shadow"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          {categories.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {categories.map((value) => (
                <button
                  key={value}
                  onClick={() => setCategory(value)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition",
                    category === value
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                  )}
                >
                  {value === "all" ? "All categories" : value}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <DashboardSection
        eyebrow="Assigned"
        title="Your active cohorts"
        description="Track progress and reopen lessons instantly"
      >
        {assignedFiltered.length === 0 ? (
          <div className="space-y-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            <p>No cohorts match the current filters. Try adjusting the search or focus on a different level.</p>
            <Button size="sm" variant="secondary" onClick={clearFilters}>
              Reset filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {assignedFiltered.map((enrollment) => (
              <div
                key={enrollment.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="space-y-1">
                  <p className="text-base font-semibold text-slate-900">{enrollment.course.title}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {enrollment.course.level?.toLowerCase() ?? "self-paced"}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-1">{enrollment.course.tagline ?? "Keep your streak."}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <ProgressRing value={enrollment.progress} />
                    <span className="text-sm font-medium text-slate-600">{enrollment.progress}% mastery</span>
                  </div>
                  <Button size="sm" asChild className="rounded-full">
                    <Link href={`/courses/${enrollment.course.slug ?? enrollment.course.id}`}>
                      Continue
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardSection>

      <DashboardSection
        eyebrow="Discover"
        title="Explore more programs"
        description="Approved tutor/admin tracks tailored to you"
      >
        {catalogFiltered.length === 0 ? (
          <div className="space-y-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            <p>No catalog courses match the current filters.</p>
            <Button size="sm" variant="secondary" onClick={clearFilters}>
              Reset filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {catalogFiltered.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  );
}
