"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type AssignedCourse = {
  courseId: string;
  title: string;
  level: string;
  category: string;
  assignedAt: Date;
};

type AssignableCourse = {
  id: string;
  title: string;
  level: string;
  category: string;
};

type StudentSummary = {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: Date;
};

type Action = (formData: FormData) => void | Promise<void>;

export function StudentDetailsModal({
  student,
  assignableCourses,
  assignedCourses,
  assignAction,
  unassignAction,
  statusAction,
}: {
  student: StudentSummary;
  assignableCourses: AssignableCourse[];
  assignedCourses: AssignedCourse[];
  assignAction: Action;
  unassignAction: Action;
  statusAction: Action;
}) {
  const assignedIds = new Set(assignedCourses.map((course) => course.courseId));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="text-xs">
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{student.name || "Student details"}</DialogTitle>
          <p className="text-sm text-slate-600">{student.email}</p>
        </DialogHeader>

        <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
            <Badge variant="outline" className="mt-1 capitalize">
              {student.status.toLowerCase()}
            </Badge>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Joined</p>
            <p className="mt-1 font-medium text-slate-700">
              {new Intl.DateTimeFormat("en", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }).format(student.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Assigned courses</p>
            <p className="mt-1 font-medium text-slate-700">{assignedCourses.length}</p>
          </div>
        </div>

        <div className="space-y-2 border-t border-slate-200 pt-3">
          <h3 className="text-sm font-semibold text-slate-900">Account actions</h3>
          {student.status === "SUSPENDED" ? (
            <form action={statusAction}>
              <input type="hidden" name="userId" value={student.id} />
              <input type="hidden" name="status" value="ACTIVE" />
              <Button type="submit" size="sm" variant="outline" className="text-emerald-700 border-emerald-300 hover:bg-emerald-50">
                Reactivate account
              </Button>
            </form>
          ) : (
            <form action={statusAction}>
              <input type="hidden" name="userId" value={student.id} />
              <input type="hidden" name="status" value="SUSPENDED" />
              <Button type="submit" size="sm" variant="outline" className="text-rose-600 border-rose-300 hover:bg-rose-50">
                Suspend account
              </Button>
            </form>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">Assigned courses</h3>
          {assignedCourses.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
              No active assigned courses.
            </div>
          ) : (
            <div className="space-y-2">
              {assignedCourses.map((course) => (
                <div
                  key={course.courseId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{course.title}</p>
                    <p className="text-xs text-slate-500">
                      {course.category} · {course.level}
                    </p>
                  </div>
                  <form action={unassignAction}>
                    <input type="hidden" name="studentId" value={student.id} />
                    <input type="hidden" name="courseId" value={course.courseId} />
                    <input type="hidden" name="notes" value="Unassigned from student modal" />
                    <Button type="submit" size="sm" variant="destructive" className="text-xs">
                      Unassign
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 border-t border-slate-200 pt-3">
          <h3 className="text-sm font-semibold text-slate-900">Assign a new course</h3>
          <form action={assignAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="studentId" value={student.id} />
            <input type="hidden" name="notes" value="Assigned from student details modal" />
            <select
              name="courseId"
              defaultValue=""
              className="min-w-[220px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              required
            >
              <option value="" disabled>
                Select course
              </option>
              {assignableCourses.map((course) => (
                <option key={course.id} value={course.id} disabled={assignedIds.has(course.id)}>
                  {course.title}{assignedIds.has(course.id) ? " (assigned)" : ""}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm" disabled={assignableCourses.length === 0}>
              Assign course
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
