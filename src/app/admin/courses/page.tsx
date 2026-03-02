import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { BookOpenCheck, Layers3, Palette, Users2 } from "lucide-react";

type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

const CourseLevelValues = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { Textarea } from "@/components/ui/textarea";
import {
  createAdminCourse,
  getCourseManagementSnapshot,
  listAdminCourses,
  requireAdminUser,
} from "@/features/admin/service";

import { AdminShell } from "../_components/admin-shell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function createCourseAction(formData: FormData) {
  "use server";

  await requireAdminUser();

  const slug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const level = String(formData.get("level") ?? "BEGINNER").toUpperCase() as CourseLevel;
  const coverImage = String(formData.get("coverImage") ?? "").trim();

  if (!slug || !title || !description) {
    notFound();
  }

  await createAdminCourse({
    slug,
    title,
    tagline,
    description,
    category,
    level,
    coverImage,
  });

  revalidatePath("/admin/courses");
}

export default async function AdminCoursesPage() {
  const [admin, courses, snapshot] = await Promise.all([
    requireAdminUser(),
    listAdminCourses(),
    getCourseManagementSnapshot(),
  ]);

  const statCards = [
    {
      title: "Total catalog",
      value: snapshot.totals.totalCourses,
      icon: Layers3,
      trend: { value: 6, isPositive: true },
    },
    {
      title: "Tutor-led",
      value: snapshot.totals.tutorLedCourses,
      icon: Users2,
      trend: { value: 11, isPositive: true },
    },
    {
      title: "Admin drafts",
      value: snapshot.totals.adminDrafts,
      icon: Palette,
      trend: { value: 2, isPositive: false },
    },
    {
      title: "Launch-ready",
      value: courses.filter((course) => course._count?.enrollments ?? 0 > 0).length,
      icon: BookOpenCheck,
      trend: { value: 4, isPositive: true },
    },
  ] as const;

  return (
    <div className="space-y-8">
      <AdminShell
        title="Courses"
        description="Launch and track cohort experiences with instructor assignments and enrollment pulses."
        actions={<Badge variant="secondary">{admin.role.replace("_", " ")} access</Badge>}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              trend={stat.trend}
              className="bg-gradient-to-br from-white to-slate-50"
            />
          ))}
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.35fr_0.65fr]">
          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">Live catalog</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-slate-500">
                      <th className="pb-3">Title</th>
                      <th className="pb-3">Instructor</th>
                      <th className="pb-3">Level</th>
                      <th className="pb-3">Enrollments</th>
                      <th className="pb-3">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {courses.map((course: any) => (
                      <tr key={course.id} className="text-slate-700">
                        <td className="py-3">
                          <div className="font-semibold">{course.title}</div>
                          <p className="text-xs text-slate-500">{course.category}</p>
                        </td>
                        <td>
                          <div className="text-sm font-medium">
                            {course.instructor?.firstName} {course.instructor?.lastName}
                          </div>
                          <p className="text-xs text-slate-500">
                            {course.instructor?.role === "TUTOR" ? "Tutor" : "Admin"} author
                          </p>
                        </td>
                        <td className="capitalize">{course.level.toLowerCase()}</td>
                        <td>{course._count?.enrollments || 0}</td>
                        <td>
                          {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
                            new Date(course.createdAt),
                          )}
                        </td>
                      </tr>
                    ))}
                    {courses.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm text-slate-500">
                          No courses yet. Use the form to launch your first cohort.
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
              <CardTitle className="text-base font-semibold text-slate-900">
                Create course
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" action={createCourseAction}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Slug</label>
                    <Input name="slug" placeholder="product-strategy" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Level</label>
                    <select
                      name="level"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      defaultValue="BEGINNER"
                    >
                      {CourseLevelValues.map((option) => (
                        <option key={option} value={option}>
                          {option.toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Title</label>
                  <Input name="title" placeholder="Product Strategy Lab" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Tagline</label>
                  <Input name="tagline" placeholder="Design + execution" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Category</label>
                  <Input name="category" placeholder="Product" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Cover image URL</label>
                  <Input name="coverImage" placeholder="https://images.unsplash.com/..." required />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Description</label>
                  <Textarea name="description" placeholder="Course summary" rows={4} required />
                </div>
                <Button type="submit" className="w-full">
                  Publish course
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">
                Level mix
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {CourseLevelValues.map((level) => {
                const value = snapshot.levelMap[level] ?? 0;
                const percentage = snapshot.totals.totalCourses
                  ? Math.round((value / snapshot.totals.totalCourses) * 100)
                  : 0;
                return (
                  <div key={level}>
                    <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                      <span>{level.toLowerCase()}</span>
                      <span>{value} · {percentage}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">
                Recent releases
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {snapshot.recentCourses.length === 0 && (
                <p className="text-sm text-slate-500">No course launches yet.</p>
              )}
              {snapshot.recentCourses.map((course) => (
                <div
                  key={course.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{course.title}</p>
                      <p className="text-xs text-slate-500">
                        {course.instructor?.firstName} {course.instructor?.lastName} · {course.level.toLowerCase()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {course.category}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Published{" "}
                    {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
                      course.createdAt,
                    )}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </AdminShell>
    </div>
  );
}
