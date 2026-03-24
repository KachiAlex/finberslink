"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, BookOpen } from "lucide-react";

import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgressRing } from "@/components/ui/progress-ring";
import { cn } from "@/lib/utils";
import { CourseCard } from "@/features/lms/components/course-card";
import type { CourseSummary } from "@/types/lms";

type EnrollmentStatus = "PENDING_ACCEPTANCE" | "ACTIVE" | "COMPLETED" | "WITHDRAWN";
type CourseAssignmentStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "REVOKED";

interface AssignedCourseCard {
  id: string;
  status: EnrollmentStatus;
  progress: number;
  acceptedAt?: string | null;
  assignment?: {
    id: string;
    status: CourseAssignmentStatus;
    assignedAt?: string | null;
    notes?: string | null;
    assignedBy?: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
    } | null;
  } | null;
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
  const [assignedCards, setAssignedCards] = useState<AssignedCourseCard[]>(assigned);
  const [catalog, setCatalog] = useState<CourseSummary[]>(initialCatalog);
  const [pagination, setPagination] = useState<PaginationState>(initialPagination);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [assignmentActionId, setAssignmentActionId] = useState<string | null>(null);
  const loading = catalogLoading || isPending;

  useEffect(() => {
    setFilters({
      search: initialFilters?.search ?? "",
      level: (initialFilters?.level ?? "all") as LevelFilter,
      category: initialFilters?.category ?? "all",
      sort: initialFilters?.sort ?? "recent",
      page: initialFilters?.page ?? 1,
    });
    setAssignedCards(assigned);
    setCatalog(initialCatalog);
    setPagination(initialPagination);
  }, [assigned, initialCatalog, initialPagination, initialFilters]);

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
        if (nextFilters.search && nextFilters.search.trim()) {
          params.set("search", nextFilters.search.trim());
        }
        if (nextFilters.level && nextFilters.level !== "all") {
          params.set("level", nextFilters.level);
        }
        if (nextFilters.category && nextFilters.category !== "all") {
          params.set("category", nextFilters.category);
        }
        if (nextFilters.sort) {
          params.set("sort", nextFilters.sort);
        }
        params.set("page", String(nextFilters.page || 1));

        const queryString = params.toString();
        const url = `/api/dashboard/courses${queryString ? `?${queryString}` : ""}`;

        const response = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to load catalog (${response.status})`);
        }

        const data = await response.json();
        const payload = data as {
          courses: CourseSummary[];
          pagination: PaginationState;
        };

        setCatalog(payload.courses || []);
        setPagination(payload.pagination || { page: 1, pageSize: 12, total: 0, totalPages: 0 });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load catalog";
        console.error("Dashboard catalog fetch failed:", error);
        setCatalogError(message);
        setCatalog([]);
        setPagination({ page: 1, pageSize: 12, total: 0, totalPages: 0 });
      } finally {
        setCatalogLoading(false);
      }
    },
    [],
  );

  const applyFilters = useCallback(
    (partial: Partial<FiltersState>, options?: { resetPage?: boolean }) => {
      setFilters((prev) => {
        const merged: FiltersState = {
          search: partial.search !== undefined ? partial.search : prev.search,
          level: partial.level !== undefined ? partial.level : prev.level,
          category: partial.category !== undefined ? partial.category : prev.category,
          sort: partial.sort !== undefined ? partial.sort : prev.sort,
          page: options?.resetPage ? 1 : (partial.page !== undefined ? partial.page : prev.page),
        };

        startTransition(() => {
          updateUrl(merged);
          void fetchCatalog(merged);
        });

        return merged;
      });
    },
    [fetchCatalog, updateUrl],
  );

  const categories = useMemo(() => {
    const values = new Set<string>();
    [...assignedCards, ...catalog].forEach((card) => {
      const cat = "course" in card ? card.course.category : card.category;
      if (cat) values.add(cat);
    });
    return ["all", ...Array.from(values)];
  }, [assignedCards, catalog]);

  const normalizedSearch = filters.search.trim().toLowerCase();

  const matchesSearch = (text: string | null | undefined) => {
    if (!normalizedSearch) return true;
    if (!text) return false;
    return text.toLowerCase().includes(normalizedSearch);
  };

  const assignedFiltered = useMemo(() => {
    return assignedCards.filter(({ course }) => {
      const levelMatch = filters.level === "all" || (course.level?.toLowerCase() ?? "") === filters.level;
      const categoryMatch =
        filters.category === "all" || (course.category ?? "").toLowerCase() === filters.category.toLowerCase();
      const searchMatch =
        matchesSearch(course.title) || matchesSearch(course.tagline) || matchesSearch(course.category);
      return levelMatch && categoryMatch && searchMatch;
    });
  }, [assignedCards, filters.category, filters.level, normalizedSearch]);

  const clearFilters = () => {
    applyFilters({ search: "", level: "all", category: "all", sort: "recent" }, { resetPage: true });
  };

  const filterActive = filters.level !== "all" || filters.category !== "all" || Boolean(normalizedSearch);

  const canPrevPage = filters.page > 1;
  const canNextPage = filters.page < (pagination?.totalPages ?? 1);

  const showingRangeStart = catalog.length === 0 ? 0 : (filters.page - 1) * pagination.pageSize + 1;
  const showingRangeEnd = catalog.length === 0 ? 0 : showingRangeStart + catalog.length - 1;

  const assignmentAction = async (enrollmentId: string, action: "accept" | "decline") => {
    try {
      setAssignmentActionId(enrollmentId);
      const response = await fetch(`/api/dashboard/enrollments/${enrollmentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Unable to update assignment");
      }

      setAssignedCards((prev) =>
        prev.map((card) => {
          if (card.id !== enrollmentId) {
            return card;
          }

          if (action === "accept") {
            return {
              ...card,
              status: "ACTIVE",
              acceptedAt: new Date().toISOString(),
              assignment: card.assignment
                ? {
                    ...card.assignment,
                    status: "ACCEPTED",
                    assignedAt: card.assignment.assignedAt ?? new Date().toISOString(),
                  }
                : card.assignment,
            };
          }

          return {
            ...card,
            status: "WITHDRAWN",
            assignment: card.assignment
              ? {
                  ...card.assignment,
                  status: "DECLINED",
                }
              : card.assignment,
          };
        }),
      );
    } catch (error) {
      console.error("Enrollment assignment action failed", error);
      // Surface toast once global notifications land; for now rely on console + fallback alert.
      alert(error instanceof Error ? error.message : "Unable to update assignment right now.");
    } finally {
      setAssignmentActionId(null);
    }
  };

  const renderAssignmentStatus = (card: AssignedCourseCard) => {
    const status = card.status;
    const assignmentStatus = card.assignment?.status;
    const assignedByName = card.assignment?.assignedBy
      ? `${card.assignment.assignedBy.firstName ?? ""} ${card.assignment.assignedBy.lastName ?? ""}`.trim()
      : null;

    const chipConfig: Record<EnrollmentStatus, { label: string; className: string }> = {
      PENDING_ACCEPTANCE: { label: "Awaiting acceptance", className: "bg-amber-50 text-amber-700" },
      ACTIVE: { label: "Active", className: "bg-emerald-50 text-emerald-700" },
      COMPLETED: { label: "Completed", className: "bg-blue-50 text-blue-700" },
      WITHDRAWN: { label: "Withdrawn", className: "bg-slate-100 text-slate-500" },
    };

    const chip = chipConfig[status];

    return (
      <div className="space-y-1">
        <div className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold" role="status">
          <span className={chip.className}>{chip.label}</span>
        </div>
        {status === "PENDING_ACCEPTANCE" ? (
          <p className="text-xs text-slate-500">
            Assigned {card.assignment?.assignedAt ? new Date(card.assignment.assignedAt).toLocaleDateString() : "recently"}
            {assignedByName ? ` · ${assignedByName}` : ""}
          </p>
        ) : assignmentStatus ? (
          <p className="text-xs text-slate-500">Assignment status: {assignmentStatus.toLowerCase()}</p>
        ) : null
        }
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Learning Runway Section */}
      <div>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Courses</p>
            <h3 className="text-2xl font-semibold text-slate-900">Learning runway</h3>
            <p className="text-sm text-slate-500">Structured roadmap of your enrollments.</p>
          </div>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/dashboard/courses">Browse Catalog</Link>
          </Button>
        </div>

        {assignedCards.length ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {assignedCards.map((enrollment) => {
              const progressVariant = 
                (enrollment.progress ?? 0) >= 75 ? 'emerald' :
                (enrollment.progress ?? 0) >= 50 ? 'blue' :
                (enrollment.progress ?? 0) >= 25 ? 'amber' : 'slate';

              const progressColor = {
                emerald: 'from-emerald-500 to-green-500',
                blue: 'from-blue-500 to-cyan-500',
                amber: 'from-amber-500 to-orange-500',
                slate: 'from-slate-400 to-slate-500',
              }[progressVariant];

              return (
                <div 
                  key={enrollment.id} 
                  className="group rounded-2xl border border-slate-200 hover:border-blue-300 bg-gradient-to-br from-white via-slate-50 to-slate-50 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-blue-200/30"
                >
                  {/* Course Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {enrollment.course.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">{enrollment.course.level ?? "Self-paced"}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-blue-600">{enrollment.progress ?? 0}%</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${progressColor} transition-all duration-500`}
                        style={{ width: `${enrollment.progress ?? 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 mb-4 py-3 border-y border-slate-200">
                    <div className="text-center">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Lessons</p>
                      <p className="text-sm font-semibold text-slate-900">8/10</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Time</p>
                      <p className="text-sm font-semibold text-slate-900">12h 30m</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Status</p>
                      <p className="text-sm font-semibold text-emerald-600">On Track</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button asChild className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" size="sm">
                      <Link href={`/courses/${enrollment.course.slug ?? enrollment.course.id}`}>
                        Continue
                      </Link>
                    </Button>
                    {(enrollment.progress ?? 0) >= 100 && (
                      <Button variant="outline" className="flex-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50" size="sm">
                        View Certificate
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-blue-50 p-8 text-center transition-all hover:border-blue-300 hover:shadow-md">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
              <BookOpen className="h-7 w-7 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No courses yet</h3>
            <p className="text-sm text-slate-600 mb-4">Start learning by enrolling in a course from our catalog.</p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/dashboard/courses">Browse Courses</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Filters Section */}
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
              <div key={enrollment.id} className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="space-y-2">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{enrollment.course.title}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      {enrollment.course.level?.toLowerCase() ?? "self-paced"}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {enrollment.course.tagline ?? "Keep your streak."}
                    </p>
                  </div>
                  {renderAssignmentStatus(enrollment)}
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3">
                    <ProgressRing value={enrollment.progress} />
                    <span className="text-sm font-medium text-slate-600">{enrollment.progress}% mastery</span>
                  </div>
                  {enrollment.status === "PENDING_ACCEPTANCE" ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="rounded-full"
                        disabled={assignmentActionId === enrollment.id}
                        onClick={() => assignmentAction(enrollment.id, "accept")}
                      >
                        {assignmentActionId === enrollment.id ? "Accepting..." : "Accept & start"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full text-slate-500 hover:text-slate-900"
                        disabled={assignmentActionId === enrollment.id}
                        onClick={() => assignmentAction(enrollment.id, "decline")}
                      >
                        {assignmentActionId === enrollment.id ? "Updating..." : "Decline"}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      asChild
                      className="rounded-full"
                      disabled={enrollment.status !== "ACTIVE"}
                      variant={enrollment.status === "ACTIVE" ? "default" : "outline"}
                    >
                      <Link
                        aria-disabled={enrollment.status !== "ACTIVE"}
                        tabIndex={enrollment.status !== "ACTIVE" ? -1 : 0}
                        href={`/courses/${enrollment.course.slug ?? enrollment.course.id}`}
                      >
                        {enrollment.status === "COMPLETED" ? "Review" : "Continue"}
                      </Link>
                    </Button>
                  )}
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
