import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireSession } from "@/lib/auth/session";
import { getTutorCourseDraft } from "@/features/tutor/service";
import { prisma } from "@/lib/prisma";
import type { CourseLevel } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function EditCourseAction(formData: FormData) {
  "use server";

  const session = await requireSession({
    allowedRoles: ["TUTOR"],
    requireTenant: true,
    failureMode: "error",
  });

  const courseId = formData.get("courseId") as string;
  const title = formData.get("title") as string;
  const tagline = formData.get("tagline") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const level = formData.get("level") as string;

  if (!courseId || !title || !tagline || !description || !category || !level) {
    throw new Error("All fields are required");
  }

  const course = await prisma.course.findFirst({
    where: { id: courseId, instructorId: session.sub },
  });

  if (!course) {
    throw new Error("Course not found");
  }

  // Update course and set status back to PENDING for admin review
  await prisma.course.update({
    where: { id: courseId },
    data: {
      title,
      tagline,
      description,
      category,
      level: level as CourseLevel,
      approvalStatus: course.approvalStatus === "CHANGES" ? "PENDING" : course.approvalStatus,
      updatedAt: new Date(),
    },
  });
}

export default async function EditCoursePage(props: any) {
  const { params } = props as { params: { slug: string } };
  const session = await requireSession({
    allowedRoles: ["TUTOR"],
    requireTenant: true,
    failureMode: "error",
  });

  // Get course by slug
  const course = await prisma.course.findFirst({
    where: {
      slug: params.slug,
      instructorId: session.sub,
    },
  });

  if (!course) {
    notFound();
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-amber-50 text-amber-700";
      case "PENDING":
        return "bg-blue-50 text-blue-700";
      case "APPROVED":
        return "bg-emerald-50 text-emerald-700";
      case "CHANGES":
        return "bg-rose-50 text-rose-700";
      default:
        return "bg-slate-50 text-slate-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "Draft";
      case "PENDING":
        return "Pending Review";
      case "APPROVED":
        return "Approved";
      case "CHANGES":
        return "Needs Updates";
      default:
        return status;
    }
  };

  const canEdit = !course.tutorEditingLocked && 
    (course.approvalStatus === "DRAFT" || course.approvalStatus === "CHANGES");

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Button asChild variant="ghost" size="sm">
                <Link href="/tutor/courses">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to courses
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl font-semibold text-slate-900">
              {course.title}
            </h1>
            <p className="text-slate-600 mt-2">{course.tagline}</p>
          </div>
          <Badge className={getStatusColor(course.approvalStatus)}>
            {getStatusLabel(course.approvalStatus)}
          </Badge>
        </div>

        {/* Status Information */}
        {course.approvalStatus === "CHANGES" && (
          <Card className="border border-rose-200 bg-rose-50">
            <CardContent className="pt-6">
              <p className="text-sm text-rose-700 font-medium">
                Admin has requested modifications to this course. Please update the fields below and resubmit for review.
              </p>
            </CardContent>
          </Card>
        )}

        {course.approvalStatus === "PENDING" && (
          <Card className="border border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-700">
                This course is awaiting admin review. You can view details below. The course will be locked from editing until admin reviews it.
              </p>
            </CardContent>
          </Card>
        )}

        {course.approvalStatus === "APPROVED" && (
          <Card className="border border-emerald-200 bg-emerald-50">
            <CardContent className="pt-6">
              <p className="text-sm text-emerald-700">
                ✓ This course has been approved and is live for students.
              </p>
            </CardContent>
          </Card>
        )}

        {!canEdit && (
          <Card className="border border-slate-200 bg-slate-50">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600">
                This course is locked from editing. Contact admin if you need to make changes.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Edit Form */}
        {canEdit ? (
          <Card>
            <CardHeader>
              <CardTitle>Edit Course Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={EditCourseAction} className="space-y-6">
                <input type="hidden" name="courseId" value={course.id} />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">
                    Course Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={course.title}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">
                    Tagline
                  </label>
                  <input
                    type="text"
                    name="tagline"
                    defaultValue={course.tagline}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">
                    Description
                  </label>
                  <textarea
                    name="description"
                    defaultValue={course.description}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-32"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900">
                      Category
                    </label>
                    <select
                      name="category"
                      defaultValue={course.category}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select category</option>
                      <option value="Web Development">Web Development</option>
                      <option value="Mobile Development">Mobile Development</option>
                      <option value="Data Science">Data Science</option>
                      <option value="AI/ML">AI/ML</option>
                      <option value="DevOps">DevOps</option>
                      <option value="Cloud Computing">Cloud Computing</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900">
                      Level
                    </label>
                    <select
                      name="level"
                      defaultValue={course.level}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    Save Changes
                  </Button>
                  <Button type="button" variant="outline" asChild className="flex-1">
                    <Link href="/tutor/courses">Cancel</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Course Details (Read-Only)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                  Title
                </p>
                <p className="text-lg font-semibold text-slate-900">
                  {course.title}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                  Tagline
                </p>
                <p className="text-slate-700">{course.tagline}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                  Description
                </p>
                <p className="text-slate-700 whitespace-pre-wrap">
                  {course.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                    Category
                  </p>
                  <p className="text-slate-700">{course.category}</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                    Level
                  </p>
                  <p className="text-slate-700">{course.level}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Created</span>
              <span className="text-sm font-medium text-slate-900">
                {new Date(course.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Last Updated</span>
              <span className="text-sm font-medium text-slate-900">
                {new Date(course.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
