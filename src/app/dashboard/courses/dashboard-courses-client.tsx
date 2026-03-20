"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";

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

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

type SortFilter = "recent" | "popular";

interface FiltersState {
  search: string;
  level: LevelFilter;
  category: string;
  sort: SortFilter;
  page: number;
}

interface DashboardCoursesClientProps {
  assigned: AssignedCourseCard[];
  initialCatalog: CourseSummary[];
  initialPagination: PaginationState;
  initialFilters: FiltersState;
}

const levelFilters = [
  { label: "All levels", value: "all" as const },
  { label: "Beginner", value: "beginner" as const },
  { label: "Intermediate", value: "intermediate" as const },
  { label: "Advanced", value: "advanced" as const },
];

const sortFilters = [
  { label: "Newest", value: "recent" as const },
  { label: "Popular", value: "popular" as const },
];

type LevelFilter = typeof levelFilters[number]["value"] | "all";

export function DashboardCoursesClient({
  assigned,
  initialCatalog,
  initialPagination,
  initialFilters,
}: DashboardCoursesClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<FiltersState>(() => ({
    search: initialFilters?.search ?? "",
    level: (initialFilters?.level ?? "all") as LevelFilter,
    category: initialFilters?.category ?? "all",
    sort: initialFilters?.sort ?? "recent",
    page: initialFilters?.page ?? 1,
  }));
  const [catalog, setCatalog] = useState<CourseSummary[]>(initialCatalog);
  const [pagination, setPagination] = useState<PaginationState>(initialPagination);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const loading = catalogLoading || isPending;

  useEffect(() => {
    setFilters({
      search: initialFilters?.search ?? "",
      level: (initialFilters?.level ?? "all") as LevelFilter,
      category: initialFilters?.category ?? "all",
      sort: initialFilters?.sort ?? "recent",
      page: initialFilters?.page ?? 1,
    });
    setCatalog(initialCatalog);
    setPagination(initialPagination);
  }, [initialCatalog, initialPagination, initialFilters]);

  const updateUrl = useCallback(
    (nextFilters: FiltersState) => {
      const params = new URLSearchParams(searchParams?.toString());
      ["search", "level", "category", "sort", "page"].forEach((key) => params.delete(key));

      if (nextFilters.search.trim()) {
        params.set("search", nextFilters.search.trim());
      }

      if (nextFilters.level !== "all") {
        params.set("level", nextFilters.level);
      }

      if (nextFilters.category !== "all") {
        params.set("category", nextFilters.category);
      }

      if (nextFilters.sort !== "recent") {
        params.set("sort", nextFilters.sort);
      }

      if (nextFilters.page > 1) {
        params.set("page", String(nextFilters.page));
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const fetchCatalog = useCallback(
    async (nextFilters: FiltersState) => {
      try {
        setCatalogLoading(true);
        setCatalogError(null);

        const params = new URLSearchParams();
        if (nextFilters.search.trim()) {
          params.set("search", nextFilters.search.trim());
        }
        if (nextFilters.level !== "all") {
          params.set("level", nextFilters.level);
        }
        if (nextFilters.category !== "all") {
          params.set("category", nextFilters.category);
        }
        params.set("sort", nextFilters.sort);
        params.set("page", String(nextFilters.page));

        const response = await fetch(`/api/dashboard/courses?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load catalog courses");
        }

        const payload = (await response.json()) as {
          courses: CourseSummary[];
          pagination: PaginationState;
        };

        setCatalog(payload.courses);
        setPagination(payload.pagination);
      } catch (error) {
        console.error("Dashboard catalog fetch failed", error);
        setCatalogError("Unable to load catalog right now. Please try again.");
      } finally {
        setCatalogLoading(false);
      }
    },
    [],
  );

  const applyFilters = useCallback(
    (partial: Partial<FiltersState>, options?: { resetPage?: boolean }) => {
      setFilters((prev) => {
        const merged = { ...prev, ...partial };
        const normalized: FiltersState = {
          ...merged,
          page: options?.resetPage ? 1 : merged.page,
        };

        startTransition(() => {
          updateUrl(normalized);
        });
        void fetchCatalog(normalized);

        return normalized;
      });
    },
    [fetchCatalog, updateUrl],
  );

  const categories = useMemo(() => {
    const values = new Set<string>();
    [...assigned, ...catalog].forEach((card) => {
      const cat = "course" in card ? card.course.category : card.category;
      if (cat) values.add(cat);
    });
    return ["all", ...Array.from(values)];
  }, [assigned, catalog]);

  const normalizedSearch = filters.search.trim().toLowerCase();

  const matchesSearch = (text: string | null | undefined) => {
    if (!normalizedSearch) return true;
    if (!text) return false;
    return text.toLowerCase().includes(normalizedSearch);
  };

  const assignedFiltered = useMemo(() => {
    return assigned.filter(({ course }) => {
      const levelMatch = filters.level === "all" || (course.level?.toLowerCase() ?? "") === filters.level;
      const categoryMatch =
        filters.category === "all" || (course.category ?? "").toLowerCase() === filters.category.toLowerCase();
      const searchMatch =
        matchesSearch(course.title) || matchesSearch(course.tagline) || matchesSearch(course.category);
      return levelMatch && categoryMatch && searchMatch;
    });
  }, [assigned, filters.category, filters.level, normalizedSearch]);

  const clearFilters = () => {
    applyFilters({ search: "", level: "all", category: "all", sort: "recent" }, { resetPage: true });
  };

  const filterActive = filters.level !== "all" || filters.category !== "all" || Boolean(normalizedSearch);

  const canPrevPage = filters.page > 1;
  const canNextPage = filters.page < (pagination?.totalPages ?? 1);

  const showingRangeStart = catalog.length === 0 ? 0 : (filters.page - 1) * pagination.pageSize + 1;
  const showingRangeEnd = catalog.length === 0 ? 0 : showingRangeStart + catalog.length - 1;

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
                value={filters.search}
                onChange={(event) => applyFilters({ search: event.target.value }, { resetPage: true })}
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
                onClick={() => applyFilters({ level: option.value }, { resetPage: true })}
                className={cn(
                  "rounded-full border px-4 py-1 text-sm font-medium transition",
                  filters.level === option.value
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
                  onClick={() => applyFilters({ category: value }, { resetPage: true })}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition",
                    filters.category === value
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                  )}
                >
                  {value === "all" ? "All categories" : value}
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {sortFilters.map((option) => (
              <button
                key={option.value}
                onClick={() => applyFilters({ sort: option.value }, { resetPage: true })}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition",
                  filters.sort === option.value
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            {catalog.length === 0
              ? catalogError ?? "No catalog courses match the current filters."
              : `Showing ${showingRangeStart.toLocaleString()}-${showingRangeEnd.toLocaleString()} of ${
                  pagination.total
                } programs`}
          </p>
          {loading ? (
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Refreshing
            </div>
          ) : null}
        </div>
        {catalogError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {catalogError}
          </div>
        ) : null}
        {catalog.length === 0 && !catalogError ? (
          <div className="space-y-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            <p>No catalog courses match the current filters.</p>
            <Button size="sm" variant="secondary" onClick={clearFilters}>
              Reset filters
            </Button>
          </div>
        ) : null}
        {catalog.length > 0 ? (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              {catalog.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
            {pagination.totalPages > 1 ? (
              <div className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Page {filters.page} of {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canPrevPage || loading}
                    onClick={() => (canPrevPage ? applyFilters({ page: filters.page - 1 }) : null)}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    disabled={!canNextPage || loading}
                    onClick={() => (canNextPage ? applyFilters({ page: filters.page + 1 }) : null)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </DashboardSection>
    </div>
  );
}
