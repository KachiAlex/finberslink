import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { listStudentEnrollmentsWithCourses } from "@/features/dashboard/service";
import { createForumThread } from "@/features/forum/service";
import { requireSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function createThreadAction(formData: FormData) {
  "use server";

  const session = await requireSession({ failureMode: "error" });

  const title = String(formData.get("title") ?? "").trim();
  const courseId = String(formData.get("courseId") ?? "").trim();

  if (!title || !courseId) return;

  const thread = await createForumThread({
    title,
    courseId,
    authorId: session.sub,
  });

  redirect(`/forum/${thread.id}`);
}

export default async function NewThreadPage() {
  const session = await requireSession();

  // Fetch user's enrolled courses
  const courses = (await listStudentEnrollmentsWithCourses({ userId: session.sub }))
    .slice()
    .sort((left, right) => left.course.title.localeCompare(right.course.title));

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <header>
          <h1 className="text-3xl font-semibold text-slate-900">New Thread</h1>
          <p className="text-slate-600">Start a discussion in your course forum.</p>
        </header>

        {courses.length === 0 ? (
          <Card className="border border-slate-200/70 bg-white/95">
            <CardContent className="py-12 text-center">
              <p className="text-sm text-slate-500">You must be enrolled in a course to start a forum thread.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-900">Create thread</CardTitle>
              <CardDescription>Choose a course and write your question or topic.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" action={createThreadAction}>
                <div className="space-y-2">
                  <Label htmlFor="courseId">Course</Label>
                  <select
                    id="courseId"
                    name="courseId"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select a course</option>
                    {courses.map((enrollment) => (
                      <option key={enrollment.course.id} value={enrollment.course.id}>
                        {enrollment.course.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Thread title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Question about week 3 assignment"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Create thread
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
