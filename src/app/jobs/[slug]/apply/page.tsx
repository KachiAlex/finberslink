import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Upload, FileText, User } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getJobBySlug, createJobApplication, getUserJobApplications } from "@/features/jobs/service";
import { verifyToken } from "@/lib/auth/jwt";
import { listUserResumes } from "@/features/resume/service";

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

  const accessToken = formData.get("accessToken") as string;
  if (!accessToken) {
    redirect("/login");
  }

  const user = verifyToken(accessToken);
  
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

    const existingApplications = await getUserJobApplications(user.sub);
    const hasAlreadyApplied = existingApplications.some(
      app => app.jobOpportunityId === job.id
    );

    if (hasAlreadyApplied) {
      return;
    }

    await createJobApplication({
      jobOpportunityId: job.id,
      userId: user.sub,
      resumeId,
      coverLetter: coverLetter || undefined,
    });

    redirect(`/jobs/${jobSlug}/apply/success`);
  } catch (error) {
    console.error("Application submission error:", error);
  }
}

export default async function JobApplyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  let userResumes: any[] = [];
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;
    if (accessToken) {
      const { verifyToken } = await import("@/lib/auth/jwt");
      const user = verifyToken(accessToken);
      userResumes = await listUserResumes(user.sub);
    }
  } catch {
    // Handle non-authenticated users
  }

  const job = await getJobBySlug(slug);

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
                      <Button variant="outline" asChild>
                        <Link href="/login">
                          Sign In
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form className="space-y-6" action={submitApplicationAction}>
                    <input type="hidden" name="jobSlug" value={slug} />
                    <input type="hidden" name="accessToken" />
                    
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
                              defaultChecked={resume.id === userResumes[0]?.id}
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
                        placeholder="Tell us why you're interested in this position and why you'd be a great fit..."
                        rows={6}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This is your chance to stand out! Highlight your relevant experience and skills.
                      </p>
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
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
