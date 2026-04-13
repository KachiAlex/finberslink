"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle2, Clock, AlertCircle, PencilLine } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CourseLevel } from "@prisma/client";

type ApprovalStatus = "DRAFT" | "PENDING" | "APPROVED" | "CHANGES";

type PendingEditPayload = {
  title?: string;
  tagline?: string;
  description?: string;
  category?: string;
  level?: string;
  coverImage?: string;
  outcomes?: string[];
  skills?: string[];
  submittedAt?: string;
};

type CourseData = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  level: CourseLevel;
  coverImage: string;
  outcomes: string[];
  skills: string[];
  approvalStatus: ApprovalStatus;
  tutorEditingLocked: boolean;
  hasPendingEdit: boolean;
  pendingEdit: PendingEditPayload | null;
  createdAt: string;
  updatedAt: string;
};

const STATUS_LABEL: Record<ApprovalStatus, string> = {
  DRAFT: "Draft",
  PENDING: "Pending Review",
  APPROVED: "Approved",
  CHANGES: "Needs Updates",
};

const STATUS_STYLE: Record<ApprovalStatus, string> = {
  DRAFT: "bg-amber-50 text-amber-700",
  PENDING: "bg-blue-50 text-blue-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  CHANGES: "bg-rose-50 text-rose-700",
};

const CATEGORIES = [
  "Web Development",
  "Mobile Development",
  "Data Science",
  "AI/ML",
  "DevOps",
  "Cloud Computing",
  "Other",
];

interface EditCourseClientProps {
  course: CourseData;
}

export function EditCourseClient({ course }: EditCourseClientProps) {
  const router = useRouter();
  const isApproved = course.approvalStatus === "APPROVED";

  // For APPROVED courses: edit-request mode (form submits to /api/tutor/courses/[id]/edit-request)
  // For DRAFT/CHANGES: direct edit (form patches /api/tutor/courses which calls upsertTutorCourseDraft)
  const [form, setForm] = useState({
    title: course.title,
    tagline: course.tagline,
    description: course.description,
    category: course.category,
    level: course.level as string,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canEdit =
    !course.tutorEditingLocked ||
    isApproved; // Approved courses use the edit-request pathway, always editable

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmitEditRequest = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/tutor/courses/${course.id}/edit-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          tagline: form.tagline.trim(),
          description: form.description.trim(),
          category: form.category.trim(),
          level: form.level,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit edit request");
      }
      setSuccess("Your edit request has been submitted and is awaiting admin review. The course remains live for students with its current content until the changes are approved.");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDirectSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/tutor/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          title: form.title.trim(),
          tagline: form.tagline.trim(),
          description: form.description.trim(),
          category: form.category.trim(),
          level: form.level,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save changes");
      }
      setSuccess("Changes saved.");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const pendingEdit = course.pendingEdit as PendingEditPayload | null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-3">
              <Link href="/tutor/courses">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to courses
              </Link>
            </Button>
            <h1 className="text-3xl font-semibold text-slate-900">{course.title}</h1>
            <p className="text-slate-600 mt-2">{course.tagline}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={STATUS_STYLE[course.approvalStatus]}>
              {STATUS_LABEL[course.approvalStatus]}
            </Badge>
            {course.hasPendingEdit && (
              <Badge className="bg-violet-50 text-violet-700">
                <Clock className="h-3 w-3 mr-1" />
                Edit pending review
              </Badge>
            )}
          </div>
        </div>

        {/* Status banners */}
        {course.approvalStatus === "APPROVED" && (
          <Card className="border border-emerald-200 bg-emerald-50">
            <CardContent className="pt-5 pb-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Course is live</p>
                <p className="text-sm text-emerald-700 mt-0.5">
                  Students can see and enroll in this course. Any edits you submit below will go through admin review before going live.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {course.approvalStatus === "CHANGES" && (
          <Card className="border border-rose-200 bg-rose-50">
            <CardContent className="pt-5 pb-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-rose-800">Admin requested modifications</p>
                <p className="text-sm text-rose-700 mt-0.5">
                  Update the fields below and save. The course will return to pending review after saving.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {course.approvalStatus === "PENDING" && (
          <Card className="border border-blue-200 bg-blue-50">
            <CardContent className="pt-5 pb-4 flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Awaiting admin review</p>
                <p className="text-sm text-blue-700 mt-0.5">
                  This course is locked while under review. You can view the details below.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending edit summary — shows what's waiting for review */}
        {isApproved && course.hasPendingEdit && pendingEdit && (
          <Card className="border border-violet-200 bg-violet-50">
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-sm font-semibold text-violet-800 flex items-center gap-2">
                <PencilLine className="h-4 w-4" />
                Pending edit — awaiting admin approval
              </CardTitle>
              {pendingEdit.submittedAt && (
                <p className="text-xs text-violet-600">
                  Submitted {new Date(pendingEdit.submittedAt).toLocaleString()}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-2 pb-5">
              {[
                { label: "Title", live: course.title, pending: pendingEdit.title },
                { label: "Tagline", live: course.tagline, pending: pendingEdit.tagline },
                { label: "Category", live: course.category, pending: pendingEdit.category },
                { label: "Level", live: course.level, pending: pendingEdit.level },
              ]
                .filter((row) => row.pending && row.pending !== row.live)
                .map((row) => (
                  <div key={row.label} className="text-sm grid grid-cols-3 gap-2 items-start">
                    <span className="font-medium text-violet-800">{row.label}</span>
                    <span className="text-slate-500 line-through text-xs pt-0.5">{row.live}</span>
                    <span className="text-violet-900 font-medium">{row.pending}</span>
                  </div>
                ))}
              {pendingEdit.description && pendingEdit.description !== course.description && (
                <div className="text-sm">
                  <span className="font-medium text-violet-800 block mb-1">Description</span>
                  <div className="rounded-md border border-violet-200 bg-white/60 p-3 text-xs text-violet-900 whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {pendingEdit.description}
                  </div>
                </div>
              )}
              <p className="pt-2 text-xs text-violet-700">
                If you need to cancel this pending request, contact an admin.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Edit form */}
        {canEdit && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isApproved ? (
                  <>
                    <PencilLine className="h-4 w-4 text-slate-500" />
                    {course.hasPendingEdit ? "Update edit request" : "Submit an edit request"}
                  </>
                ) : (
                  "Edit Course Details"
                )}
              </CardTitle>
              {isApproved && (
                <p className="text-sm text-slate-500 mt-1">
                  Changes will not be visible to students until an admin approves this request.
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">Course Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">Tagline</label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => handleChange("tagline", e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-32 resize-y"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Level</label>
                  <select
                    value={form.level}
                    onChange={(e) => handleChange("level", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Feedback */}
              {success && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-sm text-emerald-700">{success}</p>
                </div>
              )}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  className="flex-1"
                  disabled={saving}
                  onClick={isApproved ? handleSubmitEditRequest : handleDirectSave}
                >
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {isApproved
                    ? course.hasPendingEdit
                      ? "Update edit request"
                      : "Submit for review"
                    : "Save changes"}
                </Button>
                <Button type="button" variant="outline" asChild className="flex-1">
                  <Link href="/tutor/courses">Cancel</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Read-only view for PENDING courses */}
        {!canEdit && (
          <Card>
            <CardHeader>
              <CardTitle>Course Details (Read-Only)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Title</p>
                <p className="text-lg font-semibold text-slate-900">{course.title}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Tagline</p>
                <p className="text-slate-700">{course.tagline}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Description</p>
                <p className="text-slate-700 whitespace-pre-wrap">{course.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Category</p>
                  <p className="text-slate-700">{course.category}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Level</p>
                  <p className="text-slate-700">{course.level}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Meta */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Course Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Created</span>
              <span className="font-medium text-slate-900">{new Date(course.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Last Updated</span>
              <span className="font-medium text-slate-900">{new Date(course.updatedAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

      </div>
    </main>
  );
}
