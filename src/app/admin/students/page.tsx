import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { UserStatus as PrismaUserStatus } from "@prisma/client";

const UserStatusValues: PrismaUserStatus[] = ['ACTIVE', 'SUSPENDED', 'INVITED'];
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  assignCourseToStudent,
  assignCourseToStudentsBulk,
  listAssignableCourses,
  listRecentCourseAssignmentEvents,
  listStudentAssignedCourses,
  listStudents,
  requireAdminUser,
  unassignCourseFromStudent,
  updateStudentStatus,
} from "@/features/admin/service";
import { BulkStudentSelector } from "./_components/bulk-student-selector";
import { StudentDetailsModal } from "./_components/student-details-modal";

import { AdminShell } from "../_components/admin-shell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function updateStudentStatusAction(formData: FormData) {
  "use server";

  await requireAdminUser();

  const userId = String(formData.get("userId") ?? "").trim();
  const status = String(formData.get("status") ?? "").toUpperCase() as PrismaUserStatus;

  if (!userId) {
    return;
  }

  await updateStudentStatus(userId, status);
  revalidatePath("/admin/students");
}

async function assignCourseToStudentAction(formData: FormData) {
  "use server";

  await requireAdminUser();

  const studentId = String(formData.get("studentId") ?? "").trim();
  const courseId = String(formData.get("courseId") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!studentId || !courseId) {
    redirect("/admin/students?error=missing-assignment-fields");
    return;
  }

  let errorMessage: string | null = null;
  try {
    await assignCourseToStudent({
      studentId,
      courseId,
      notes: notes || undefined,
    });
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Failed to assign course";
  }

  revalidatePath("/admin/students");
  if (errorMessage) {
    redirect(`/admin/students?error=${encodeURIComponent(errorMessage)}`);
  }
  redirect("/admin/students?success=course-assigned");
}

async function bulkAssignCourseAction(formData: FormData) {
  "use server";

  await requireAdminUser();

  const courseId = String(formData.get("courseId") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const studentIds = formData.getAll("studentIds").map((value) => String(value));

  if (!courseId || studentIds.length === 0) {
    redirect("/admin/students?error=select-course-and-students");
    return;
  }

  let assignedCount = 0;
  let errorMessage: string | null = null;
  try {
    const result = await assignCourseToStudentsBulk({
      studentIds,
      courseId,
      notes: notes || undefined,
    });
    assignedCount = result.assigned;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Failed to bulk assign courses";
  }

  revalidatePath("/admin/students");
  if (errorMessage) {
    redirect(`/admin/students?error=${encodeURIComponent(errorMessage)}`);
  }
  redirect(`/admin/students?success=bulk-assigned-${assignedCount}`);
}

async function unassignCourseFromStudentAction(formData: FormData) {
  "use server";

  await requireAdminUser();

  const studentId = String(formData.get("studentId") ?? "").trim();
  const courseId = String(formData.get("courseId") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!studentId || !courseId) {
    redirect("/admin/students?error=missing-unassignment-fields");
    return;
  }

  let errorMessage: string | null = null;
  try {
    await unassignCourseFromStudent({
      studentId,
      courseId,
      notes: notes || undefined,
    });
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Failed to unassign course";
  }

  revalidatePath("/admin/students");
  if (errorMessage) {
    redirect(`/admin/students?error=${encodeURIComponent(errorMessage)}`);
  }
  redirect("/admin/students?success=course-unassigned");
}

export default async function AdminStudentsPage(props: any) {
  const { searchParams } = props as {
    searchParams?: {
      success?: string;
      error?: string;
      studentPage?: string;
      auditPage?: string;
    };
  };
  const studentPage = Math.max(parseInt(searchParams?.studentPage ?? "1", 10) || 1, 1);
  const auditPage = Math.max(parseInt(searchParams?.auditPage ?? "1", 10) || 1, 1);

  let runtimeError: string | null = null;
  let admin: { role: string } = { role: "ADMIN" };
  let studentResult: Awaited<ReturnType<typeof listStudents>> = {
    students: [],
    pagination: { page: studentPage, limit: 12, total: 0, totalPages: 1 },
  };
  let assignableCourses: Awaited<ReturnType<typeof listAssignableCourses>> = [];

  try {
    [admin, studentResult, assignableCourses] = await Promise.all([
      requireAdminUser(),
      listStudents({ page: studentPage, limit: 12 }),
      listAssignableCourses(),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load admin student data";
    if (message === "Not authenticated") {
      throw error;
    }
    runtimeError = "Student data is temporarily unavailable due to a database sync issue. Try again in a moment.";
  }

  let assignmentEventsResult: Awaited<ReturnType<typeof listRecentCourseAssignmentEvents>> = {
    events: [],
    pagination: { page: auditPage, limit: 8, total: 0, totalPages: 1 },
  };
  try {
    assignmentEventsResult = await listRecentCourseAssignmentEvents({ page: auditPage, limit: 8 });
  } catch {
    assignmentEventsResult = {
      events: [],
      pagination: { page: auditPage, limit: 8, total: 0, totalPages: 1 },
    };
    runtimeError = runtimeError ?? "Assignment audit trail is temporarily unavailable.";
  }

  const students = studentResult.students;
  const assignmentEvents = assignmentEventsResult.events;

  let assignedCoursesMap: Record<string, Array<{
    courseId: string;
    title: string;
    level: string;
    category: string;
    assignedAt: Date;
  }>> = {};
  try {
    assignedCoursesMap = await listStudentAssignedCourses(students.map((student) => student.id));
  } catch {
    assignedCoursesMap = {};
    runtimeError = runtimeError ?? "Student enrollment map is temporarily unavailable due to a database sync issue.";
  }

  const successParam = searchParams?.success ?? "";
  const errorParam = searchParams?.error ?? "";
  const bulkMatch = successParam.match(/^bulk-assigned-(\d+)$/);
  const successMessage = bulkMatch
    ? `Assigned course to ${bulkMatch[1]} student${bulkMatch[1] === "1" ? "" : "s"}.`
    : successParam === "course-assigned"
      ? "Course assigned successfully."
      : successParam === "course-unassigned"
        ? "Course unassigned successfully."
      : null;

  return (
    <div className="space-y-8">
      <AdminShell
        title="Students"
        description="Manage learner access, status, and enrollment health across cohorts."
        actions={<Badge variant="secondary">{admin.role.replace("_", " ")} access</Badge>}
      >
        {successMessage ? (
          <Card className="border border-emerald-200 bg-emerald-50">
            <CardContent className="py-3 text-sm text-emerald-700">{successMessage}</CardContent>
          </Card>
        ) : null}
        {errorParam ? (
          <Card className="border border-rose-200 bg-rose-50">
            <CardContent className="py-3 text-sm text-rose-700">{decodeURIComponent(errorParam)}</CardContent>
          </Card>
        ) : null}
        {runtimeError ? (
          <Card className="border border-amber-200 bg-amber-50">
            <CardContent className="py-3 text-sm text-amber-800">{runtimeError}</CardContent>
          </Card>
        ) : null}

        <Card className="border border-slate-200/70 bg-white/95">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Bulk assign course</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={bulkAssignCourseAction} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <select
                  name="courseId"
                  defaultValue=""
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  required
                >
                  <option value="" disabled>
                    Select approved course
                  </option>
                  {assignableCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
                <input
                  name="notes"
                  placeholder="Optional note for all selected students"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </div>

              <BulkStudentSelector
                students={students.map((student) => ({
                  id: student.id,
                  name: `${student.firstName} ${student.lastName}`,
                  email: student.email,
                }))}
              />

              <Button type="submit" disabled={assignableCourses.length === 0 || students.length === 0}>
                Assign selected students
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/70 bg-white/95">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Student roster</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-500">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Joined</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => {
                    const statusLabel = (student.status ?? "ACTIVE").toString().toLowerCase();
                    const assignedCourses = assignedCoursesMap[student.id] ?? [];
                    return (
                    <tr key={student.id} className="text-slate-700">
                      <td className="py-3 font-semibold">
                        {student.firstName} {student.lastName}
                      </td>
                      <td>{student.email}</td>
                      <td>
                        <Badge variant="outline" className="capitalize">
                          {statusLabel}
                        </Badge>
                      </td>
                      <td>
                        {new Intl.DateTimeFormat("en", {
                          month: "short",
                          day: "numeric",
                        }).format(student.createdAt)}
                      </td>
                      <td>
                        <StudentDetailsModal
                          student={{
                            id: student.id,
                            name: `${student.firstName} ${student.lastName}`,
                            email: student.email,
                            status: String(student.status ?? "ACTIVE"),
                            createdAt: student.createdAt,
                          }}
                          assignableCourses={assignableCourses}
                          assignedCourses={assignedCourses}
                          assignAction={assignCourseToStudentAction}
                          unassignAction={unassignCourseFromStudentAction}
                          statusAction={updateStudentStatusAction}
                        />
                      </td>
                    </tr>
                    );
                  })}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-slate-500">
                        No students yet. Enrollments will appear as learners join programs.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {studentResult.pagination.totalPages > 1 ? (
              <div className="mt-4 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={studentResult.pagination.page <= 1}
                >
                  <a
                    href={`?studentPage=${Math.max(studentResult.pagination.page - 1, 1)}&auditPage=${assignmentEventsResult.pagination.page}&success=${encodeURIComponent(successParam)}&error=${encodeURIComponent(errorParam)}`}
                  >
                    Previous
                  </a>
                </Button>
                <span className="text-xs text-slate-500">
                  Student page {studentResult.pagination.page} of {studentResult.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={studentResult.pagination.page >= studentResult.pagination.totalPages}
                >
                  <a
                    href={`?studentPage=${Math.min(studentResult.pagination.page + 1, studentResult.pagination.totalPages)}&auditPage=${assignmentEventsResult.pagination.page}&success=${encodeURIComponent(successParam)}&error=${encodeURIComponent(errorParam)}`}
                  >
                    Next
                  </a>
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border border-slate-200/70 bg-white/95">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Assignment audit trail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-500">
                    <th className="pb-3">When</th>
                    <th className="pb-3">Student</th>
                    <th className="pb-3">Course</th>
                    <th className="pb-3">Event</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignmentEvents.map((event) => (
                    <tr key={event.id} className="text-slate-700">
                      <td className="py-3">
                        {new Intl.DateTimeFormat("en", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(event.assignedAt)}
                      </td>
                      <td>
                        <p className="font-medium">{event.studentName || event.studentEmail}</p>
                        <p className="text-xs text-slate-500">{event.studentEmail}</p>
                      </td>
                      <td>{event.courseTitle}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {event.status.toLowerCase()}
                          </Badge>
                          <span className="text-xs text-slate-600">
                            by {event.assignedByName || event.assignedByEmail}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {assignmentEvents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-sm text-slate-500">
                        No assignment events yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {assignmentEventsResult.pagination.totalPages > 1 ? (
              <div className="mt-4 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={assignmentEventsResult.pagination.page <= 1}
                >
                  <a
                    href={`?studentPage=${studentResult.pagination.page}&auditPage=${Math.max(assignmentEventsResult.pagination.page - 1, 1)}&success=${encodeURIComponent(successParam)}&error=${encodeURIComponent(errorParam)}`}
                  >
                    Previous
                  </a>
                </Button>
                <span className="text-xs text-slate-500">
                  Audit page {assignmentEventsResult.pagination.page} of {assignmentEventsResult.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={assignmentEventsResult.pagination.page >= assignmentEventsResult.pagination.totalPages}
                >
                  <a
                    href={`?studentPage=${studentResult.pagination.page}&auditPage=${Math.min(assignmentEventsResult.pagination.page + 1, assignmentEventsResult.pagination.totalPages)}&success=${encodeURIComponent(successParam)}&error=${encodeURIComponent(errorParam)}`}
                  >
                    Next
                  </a>
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </AdminShell>
    </div>
  );
}
