import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

const CourseLevelValues = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createAdminCourse,
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
  const [admin] = await Promise.all([requireAdminUser()]);
  const courses = await listAdminCourses();

  return (
    <div className="space-y-8">
      <AdminShell
        title="Courses"
        description="Launch and track cohort experiences with instructor assignments and enrollment pulses."
        actions={<Badge variant="secondary">{admin.role.replace("_", " ")} access</Badge>}
      >
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">Live courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-slate-500">
                      <th className="pb-3">Title</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Level</th>
                      <th className="pb-3">Enrollments</th>
                      <th className="pb-3">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {courses.map((course: any) => (
                      <tr key={course.id} className="text-slate-700">
                        <td className="py-3 font-semibold">{course.title}</td>
                        <td>{course.category}</td>
                        <td className="capitalize">{course.level.toLowerCase()}</td>
                        <td>{course._count?.enrollments || 0}</td>
                        <td>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(course.createdAt))}</td>
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
      </AdminShell>
    </div>
  );
}
