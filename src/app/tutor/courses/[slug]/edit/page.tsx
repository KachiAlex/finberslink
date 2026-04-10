import { notFound } from "next/navigation";

import { requireSession } from "../../../../lib/auth/session";
import { getTutorCourseForEdit } from "../../../../features/tutor/service";

import { EditCourseClient } from "./edit-course-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditCoursePage(props: any) {
  const { params } = props as { params: { slug: string } };

  const session = await requireSession({
    allowedRoles: ["TUTOR"],
    requireTenant: true,
    failureMode: "error",
  });

  const course = await getTutorCourseForEdit(session.sub, params.slug);

  if (!course) {
    notFound();
  }

  const pendingEdit = (course as any).pendingEdit as Record<string, unknown> | null | undefined;
  const hasPendingEdit = Boolean((course as any).hasPendingEdit);

  return (
    <EditCourseClient
      course={{
        ...course,
        hasPendingEdit,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
        pendingEdit: pendingEdit ?? null,
      }}
    />
  );
}
