export function buildDashboardCoursesUrl(params: any = {}) {
  const query = new URLSearchParams(params);
  return `/dashboard/courses?${query.toString()}`;
}
