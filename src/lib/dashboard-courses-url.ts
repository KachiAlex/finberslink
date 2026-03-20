const LEVELS = ["beginner", "intermediate", "advanced"] as const;
const SORT_OPTIONS = ["recent", "popular"] as const;

type LevelFilter = (typeof LEVELS)[number];
type SortFilter = (typeof SORT_OPTIONS)[number];

export interface DashboardCourseFilters {
  search?: string;
  level?: LevelFilter | "all";
  category?: string;
  sort?: SortFilter;
  page?: number;
}

interface BuildUrlOptions {
  basePath?: string;
}

export function buildDashboardCoursesUrl(filters: DashboardCourseFilters = {}, options: BuildUrlOptions = {}) {
  const basePath = options.basePath ?? "/dashboard/courses";
  const params = new URLSearchParams();

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.level && filters.level !== "all" && LEVELS.includes(filters.level)) {
    params.set("level", filters.level);
  }

  if (filters.category?.trim()) {
    params.set("category", filters.category.trim());
  }

  if (filters.sort && SORT_OPTIONS.includes(filters.sort)) {
    params.set("sort", filters.sort);
  }

  if (typeof filters.page === "number" && Number.isFinite(filters.page) && filters.page > 1) {
    params.set("page", String(Math.floor(filters.page)));
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function buildFocusTrackUrl(level: LevelFilter, extras?: Omit<DashboardCourseFilters, "level">) {
  return buildDashboardCoursesUrl({
    level,
    sort: "popular",
    ...extras,
  });
}
