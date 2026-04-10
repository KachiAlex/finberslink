import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Upload, FileText, User, Save } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getJobBySlug, createJobApplication, getUserJobApplications } from "@/features/jobs/service";
import { listUserResumes } from "@/features/resume/service";
import { requireSession } from "@/lib/auth/session";
import { saveApplicationDraft, getApplicationDraft } from "@/features/jobs/application-drafts";

type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
type RemoteOption = 'REMOTE' | 'HYBRID' | 'ONSITE';

export const dynamic = "force-dynamic";
export const revalidate = 0;

const jobTypeColors = {
  FULL_TIME: "bg-blue-100 text-blue-800",
  PART_TIME: "bg-green-100 text-green-800",
  CONTRACT: "bg-purple-100 text-purple-800",
  INTERNSHIP: "bg-yellow-100 text-yellow-800",
  FREELANCE: "bg-orange-100 text-orange-800",
};

const remoteOptionColors = {
  ONSITE: "bg-red-100 text-red-800",
  HYBRID: "bg-indigo-100 text-indigo-800",
  REMOTE: "bg-emerald-100 text-emerald-800",
};

async function submitApplicationAction(formData: FormData) {
  "use server";

  const session = await requireSession({
    allowedRoles: ["STUDENT"],
    failureMode: "error",
  });
  
  const jobSlug = String(formData.get("jobSlug")).trim();
  const resumeId = String(formData.get("resumeId")).trim();
  const coverLetter = String(formData.get("coverLetter")).trim();

  if (!jobSlug || !resumeId) {
    return;
  }

  try {
    // Check if user has already applied
    const job = await getJobBySlug(jobSlug);
    if (!job) {
      return;
    }

    const existingApplications = await getUserJobApplications(session.sub);
    const hasAlreadyApplied = existingApplications.some(
      app => app.jobOpportunityId === job.id
    );

    if (hasAlreadyApplied) {
      return;
    }

    await createJobApplication({
      jobOpportunityId: job.id,
      userId: session.sub,
      resumeId,
      coverLetter: coverLetter || undefined,
    });

    redirect(`/jobs/${jobSlug}/apply/success`);
  } catch (error) {
    console.error("Application submission error:", error);
  }
}

async function saveDraftAction(formData: FormData) {
  "use server";

  const session = await requireSession({
    allowedRoles: ["STUDENT"],
    failureMode: "error",
  });
  
  const jobSlug = String(formData.get("jobSlug")).trim();
  const resumeId = String(formData.get("resumeId")).trim();
  const coverLetter = String(formData.get("coverLetter")).trim();

  if (!jobSlug) {
    return;
  }

  try {
    const job = await getJobBySlug(jobSlug);
    if (!job) {
      return;
    }

    await saveApplicationDraft(session.sub, job.id, {
      resumeId: resumeId || undefined,
      coverLetter: coverLetter || undefined,
    });

    return { success: true };
  } catch (error) {
    console.error("Draft save error:", error);
    return { success: false };
  }
}

export default async function JobApplyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ draft?: string }>;
}) {
  const { slug } = await params;
  const { draft } = await searchParams;

  const session = await requireSession({
    allowedRoles: ["STUDENT"],
    failureMode: "redirect",
  });

  const userResumes = await listUserResumes(session.sub);
  const job = await getJobBySlug(slug);
  let existingDraft = null;

  if (job && draft === "true") {
    existingDraft = await getApplicationDraft(session.sub, job.id);
  }

  if (!job) {
    notFound();
  }


  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href={`/jobs/${slug}`} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Job
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{job.title}</CardTitle>
                <CardDescription className="font-medium text-gray-700">
                  {job.company}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    <Badge className={jobTypeColors[job.jobType as keyof typeof jobTypeColors]}>
                      {job.jobType.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Upload className="w-4 h-4" />
                    <Badge className={remoteOptionColors[job.remoteOption as keyof typeof remoteOptionColors]}>
                      {job.remoteOption.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>{job.location}, {job.country}</span>
                  </div>
                  {job.salaryRange && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>{job.salaryRange}</span>
                    </div>
                  )}
                </div>

                {job.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {job.tags.map((tag: any) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Application Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Apply for {job.title}</CardTitle>
                <CardDescription>
                  Submit your application to {job.company}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userResumes.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Resume Found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      You need to create a resume before applying for jobs.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button asChild>
                        <Link href="/resume/builder">
                          Create Resume
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <ApplicationForm 
                    job={job} 
                    slug={slug} 
                    userResumes={userResumes} 
                    existingDraft={existingDraft}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApplicationForm({ 
  job, 
  slug, 
  userResumes, 
  existingDraft 
}: {
  job: any;
  slug: string;
  userResumes: any[];
  existingDraft: any;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [formData, setFormData] = useState({
    resumeId: existingDraft?.resumeId || userResumes[0]?.id || "",
    coverLetter: existingDraft?.coverLetter || ""
  });

  useEffect(() => {
    if (existingDraft) {
      setFormData({
        resumeId: existingDraft.resumeId || userResumes[0]?.id || "",
        coverLetter: existingDraft.coverLetter || ""
      });
    }
  }, [existingDraft, userResumes]);

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setSaveMessage("");
    
    try {
      const formData = new FormData();
      formData.append("jobSlug", slug);
      formData.append("resumeId", formData.resumeId);
      formData.append("coverLetter", formData.coverLetter);
      
      const result = await saveDraftAction(formData);
      
      if (result?.success) {
        setSaveMessage("Draft saved successfully!");
      } else {
        setSaveMessage("Failed to save draft");
      }
    } catch (error) {
      setSaveMessage("Failed to save draft");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Draft Status */}
      {existingDraft && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800 text-sm">
            <FileText className="w-4 h-4" />
            <span>Continuing from draft saved {formatDistanceToNow(new Date(existingDraft.lastSavedAt), { addSuffix: true })}</span>
          </div>
        </div>
      )}

      <form className="space-y-6" action={submitApplicationAction}>
        <input type="hidden" name="jobSlug" value={slug} />
        
        {/* Resume Selection */}
        <div>
          <Label htmlFor="resumeId">Select Resume</Label>
          <div className="mt-2 space-y-2">
            {userResumes.map((resume) => (
              <label
                key={resume.id}
                className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name="resumeId"
                  value={resume.id}
                  required
                  checked={formData.resumeId === resume.id}
                  onChange={(e) => setFormData(prev => ({ ...prev, resumeId: e.target.value }))}
                />
                <div className="flex-1">
                  <div className="font-medium">{resume.title}</div>
                  <div className="text-sm text-gray-500">
                    Your resume
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/resume/${resume.slug}`}>
                    View
                  </Link>
                </Button>
              </label>
            ))}
          </div>
        </div>

        {/* Cover Letter */}
        <div>
          <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
          <Textarea
            id="coverLetter"
            name="coverLetter"
            value={formData.coverLetter}
            onChange={(e) => setFormData(prev => ({ ...prev, coverLetter: e.target.value }))}
            placeholder="Tell us why you're interested in this position and why you'd be a great fit..."
            rows={6}
          />
          <p className="text-xs text-gray-500 mt-1">
            This is your chance to stand out! Highlight your relevant experience and skills.
          </p>
        </div>

        {/* Save Draft Button */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? "Saving..." : "Save Draft"}
          </Button>
          
          {saveMessage && (
            <span className={`text-sm ${saveMessage.includes("success") ? "text-green-600" : "text-red-600"}`}>
              {saveMessage}
            </span>
          )}
        </div>

        {/* Submit */}
        <div className="pt-4">
          <Button type="submit" size="lg" className="w-full">
            Submit Application
          </Button>
          <p className="text-xs text-gray-500 text-center mt-2">
            By submitting, you agree to share your resume and contact information with {job.company}
          </p>
        </div>
      </form>
    </div>
  );
}

function formatDistanceToNow(date: Date, options: { addSuffix?: boolean }) {
  // Simple implementation for now
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return "just now";
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
}

