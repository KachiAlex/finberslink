import { revalidatePath } from "next/cache";

type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

const UserStatusValues = ['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const;

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  listStudents,
  requireAdminUser,
  updateStudentStatus,
} from "@/features/admin/service";

import { AdminShell } from "../_components/admin-shell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function updateStudentStatusAction(formData: FormData) {
  "use server";

  await requireAdminUser();

  const userId = String(formData.get("userId") ?? "").trim();
  const status = String(formData.get("status") ?? "").toUpperCase() as UserStatus;

  if (!userId) {
    return;
  }

  await updateStudentStatus(userId, status);
  revalidatePath("/admin/students");
}

export default async function AdminStudentsPage() {
  const [admin, students] = await Promise.all([requireAdminUser(), listStudents()]);

  return (
    <div className="space-y-8">
      <AdminShell
        title="Students"
        description="Manage learner access, status, and enrollment health across cohorts."
        actions={<Badge variant="secondary">{admin.role.replace("_", " ")} access</Badge>}
      >
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
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => (
                    <tr key={student.id} className="text-slate-700">
                      <td className="py-3 font-semibold">
                        {student.firstName} {student.lastName}
                      </td>
                      <td>{student.email}</td>
                      <td>
                        <Badge variant="outline" className="capitalize">
                          {student.status.toLowerCase()}
                        </Badge>
                      </td>
                      <td>
                        {new Intl.DateTimeFormat("en", {
                          month: "short",
                          day: "numeric",
                        }).format(student.createdAt)}
                      </td>
                      <td>
                        <form action={updateStudentStatusAction} className="inline-flex">
                          <input type="hidden" name="userId" value={student.id} />
                          <select
                            name="status"
                            defaultValue={student.status}
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
                  ))}
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
          </CardContent>
        </Card>
      </AdminShell>
    </div>
  );
}
