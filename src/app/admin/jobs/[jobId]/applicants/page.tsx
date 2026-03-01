import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getJobById, getJobApplicationsForAdmin, updateJobApplicationStatus } from "@/features/jobs/service";
import { AdminShell } from "../../../_components/admin-shell";

type JobApplicationStatus = 'SUBMITTED' | 'REVIEWING' | 'INTERVIEW' | 'OFFER' | 'REJECTED';

const JobApplicationStatusValues = ['SUBMITTED', 'REVIEWING', 'INTERVIEW', 'OFFER', 'REJECTED'] as const;

export const dynamic = "force-dynamic";
export const revalidate = 0;

const statusColors = {
  SUBMITTED: "bg-blue-100 text-blue-800",
  REVIEWING: "bg-yellow-100 text-yellow-800",
  INTERVIEW: "bg-indigo-100 text-indigo-800",
  OFFER: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

const statusIcons = {
  SUBMITTED: Clock,
  REVIEWING: Clock,
  INTERVIEW: CheckCircle,
  OFFER: CheckCircle,
  REJECTED: XCircle,
};

async function updateApplicationStatusAction(formData: FormData) {
  "use server";

  const applicationId = String(formData.get("applicationId")).trim();
  const newStatus = String(formData.get("status")).trim() as JobApplicationStatus;

  if (!applicationId || !newStatus) {
    return;
  }

  try {
    await updateJobApplicationStatus(applicationId, newStatus);
  } catch (error) {
    console.error("Error updating application status:", error);
  }
}

export default async function JobApplicantsPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const [job, applications] = await Promise.all([
    getJobById(jobId),
    getJobApplicationsForAdmin(jobId),
  ]);

  if (!job) {
    notFound();
  }

  const statusOptions = JobApplicationStatusValues;

  return (
    <div className="space-y-6">
      <AdminShell
        title="Job Applicants"
        description={`Manage applications for ${job.title} at ${job.company}`}
      >
        {/* Back Button */}
        <Button variant="outline" asChild>
          <Link href="/admin/jobs" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </Link>
        </Button>

        {/* Job Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{job.title}</CardTitle>
            <CardDescription>{job.company}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Total Applications</div>
                <div className="text-2xl font-bold">{applications.length}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Under Review</div>
                <div className="text-2xl font-bold">
                  {applications.filter((a: any) => a.status === "REVIEWING").length}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Interviews</div>
                <div className="text-2xl font-bold">
                  {applications.filter((a: any) => a.status === "INTERVIEW").length}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Offers</div>
                <div className="text-2xl font-bold">
                  {applications.filter((a: any) => a.status === "OFFER").length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        {applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((application: any) => {
              const StatusIcon = statusIcons[application.status as JobApplicationStatus];
              
              return (
                <Card key={application.id}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {/* Applicant Info */}
                      <div className="lg:col-span-2">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="font-semibold text-blue-700">
                              {application.user.firstName[0]}
                              {application.user.lastName[0]}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg">
                              {application.user.firstName} {application.user.lastName}
                            </h3>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                <a href={`mailto:${application.user.email}`} className="hover:text-blue-600">
                                  {application.user.email}
                                </a>
                              </div>
                              {application.user.profile?.headline && (
                                <div className="flex items-center gap-1">
                                  <FileText className="w-4 h-4" />
                                  {application.user.profile.headline}
                                </div>
                              )}
                              {application.user.profile?.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {application.user.profile.location}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Resume & Cover Letter */}
                      <div className="lg:col-span-1">
                        <h4 className="font-semibold text-sm mb-2">Documents</h4>
                        <div className="space-y-2">
                          {application.resume && (
                            <Button variant="outline" size="sm" className="w-full" asChild>
                              <Link href={`/resume/${application.resume.id}`}>
                                View Resume
                              </Link>
                            </Button>
                          )}
                          {application.coverLetter && (
                            <div className="p-2 bg-gray-50 rounded text-xs">
                              <p className="font-semibold mb-1">Cover Letter:</p>
                              <p className="text-gray-700 line-clamp-3">
                                {application.coverLetter}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="lg:col-span-1">
                        <h4 className="font-semibold text-sm mb-2">Status</h4>
                        <form action={updateApplicationStatusAction} className="space-y-2">
                          <input type="hidden" name="applicationId" value={application.id} />
                          <div className="flex items-center gap-2 mb-2">
                            <StatusIcon className="w-4 h-4" />
                            <Badge className={statusColors[application.status as JobApplicationStatus]}>
                              {application.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <select
                            name="status"
                            defaultValue={application.status}
                            onChange={(e) => e.target.form?.requestSubmit()}
                            className="w-full text-sm px-2 py-1 border rounded"
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status.replace("_", " ")}
                              </option>
                            ))}
                          </select>
                          <div className="text-xs text-gray-500">
                            Applied {new Date(application.submittedAt).toLocaleDateString()}
                          </div>
                        </form>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
              <p className="text-gray-600">
                This job posting hasn't received any applications yet.
              </p>
            </CardContent>
          </Card>
        )}
      </AdminShell>
    </div>
  );
}
