import { TutorCourseBuilder } from "@/app/tutor/courses/new/page";
import { requireAdminUser } from "@/features/admin/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminCreateCoursePage() {
  await requireAdminUser();

  return (
    <TutorCourseBuilder
      backHref="/admin/courses"
      backLabel="Back to course management"
      draftEndpoint="/api/tutor/courses/draft"
      coursesEndpoint="/api/tutor/courses"
      requiresReview={false}
    />
  );
}
