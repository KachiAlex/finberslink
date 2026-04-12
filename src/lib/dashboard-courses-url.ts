export function buildDashboardCoursesUrl(courseId?: string) {
  const baseUrl = '/dashboard/courses';
  return courseId ? `${baseUrl}/${courseId}` : baseUrl;
}
