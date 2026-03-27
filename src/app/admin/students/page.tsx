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
  listStudentAssignedCourseIds,
  listStudents,
  requireAdminUser,
  updateStudentStatus,
} from "@/features/admin/service";
import { BulkStudentSelector } from "./_components/bulk-student-selector";

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

export default async function AdminStudentsPage(props: any) {
  const { searchParams } = props as {
    searchParams?: {
      success?: string;
      error?: string;
    };
  };

  let runtimeError: string | null = null;
  let admin: { role: string } = { role: "ADMIN" };
  let students: Awaited<ReturnType<typeof listStudents>> = [];
  let assignableCourses: Awaited<ReturnType<typeof listAssignableCourses>> = [];

  try {
    [admin, students, assignableCourses] = await Promise.all([
      requireAdminUser(),
      listStudents(),
      listAssignableCourses(),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load admin student data";
    if (message === "Not authenticated") {
      throw error;
    }
    runtimeError = "Student data is temporarily unavailable due to a database sync issue. Try again in a moment.";
  }

  const assignmentEvents: Array<{
    id: string;
    status: string;
    assignedAt: Date;
    studentName: string;
    studentEmail: string;
    courseTitle: string;
    assignedByName: string;
    assignedByEmail: string;
    notes: string | null;
  }> = [];

  let assignedCourseMap: Record<string, string[]> = {};
  try {
    assignedCourseMap = await listStudentAssignedCourseIds(students.map((student) => student.id));
  } catch {
    assignedCourseMap = {};
    runtimeError = runtimeError ?? "Student enrollment map is temporarily unavailable due to a database sync issue.";
  }

  const successParam = searchParams?.success ?? "";
  const errorParam = searchParams?.error ?? "";
  const bulkMatch = successParam.match(/^bulk-assigned-(\d+)$/);
  const successMessage = bulkMatch
    ? `Assigned course to ${bulkMatch[1]} student${bulkMatch[1] === "1" ? "" : "s"}.`
    : successParam === "course-assigned"
      ? "Course assigned successfully."
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
                    <th className="pb-3">Assign course</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => {
                    const statusLabel = (student.status ?? "ACTIVE").toString().toLowerCase();
                    const assignedCourseIds = new Set(assignedCourseMap[student.id] ?? []);
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
                        <form action={assignCourseToStudentAction} className="inline-flex items-center gap-2">
                          <input type="hidden" name="studentId" value={student.id} />
                          <select
                            name="courseId"
                            defaultValue=""
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                            required
                            disabled={assignableCourses.length === 0}
                          >
                            <option value="" disabled>
                              Select course
                            </option>
                            {assignableCourses.map((course) => (
                              <option key={course.id} value={course.id} disabled={assignedCourseIds.has(course.id)}>
                                {course.title}{assignedCourseIds.has(course.id) ? " (assigned)" : ""}
                              </option>
                            ))}
                          </select>
                          <input type="hidden" name="notes" value="Assigned by admin from student roster" />
                          <Button type="submit" size="sm" className="text-xs" disabled={assignableCourses.length === 0}>
                            Assign
                          </Button>
                        </form>
                      </td>
                      <td>
                        <form action={updateStudentStatusAction} className="inline-flex">
                          <input type="hidden" name="userId" value={student.id} />
                          <select
                            name="status"
                            defaultValue={student.status ?? "ACTIVE"}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                          >
                            {UserStatusValues.map((option) => (
                              <option key={option} value={option}>
                                {option.toLowerCase()}
                              </option>
                            ))}
                          </select>
                          <Button type="submit" size="sm" className="ml-2 text-xs">
                            Update
                          </Button>
                        </form>
                      </td>
                    </tr>
                    );
                  })}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                        No students yet. Enrollments will appear as learners join programs.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/70 bg-white/95">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Assignment audit trail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-500">
                    <th className="pb-3">When</th>
                    <th className="pb-3">Student</th>
                    <th className="pb-3">Course</th>
                    <th className="pb-3">Assigned by</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Notes</th>
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
                        <p className="font-medium">{event.assignedByName || event.assignedByEmail}</p>
                        <p className="text-xs text-slate-500">{event.assignedByEmail}</p>
                      </td>
                      <td>
                        <Badge variant="outline" className="capitalize">
                          {event.status.toLowerCase()}
                        </Badge>
                      </td>
                      <td className="max-w-[240px] truncate text-xs text-slate-600">{event.notes || "—"}</td>
                    </tr>
                  ))}
                  {assignmentEvents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                        No assignment events yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </AdminShell>
    </div>
  );
}
