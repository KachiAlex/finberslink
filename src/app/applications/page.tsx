import Link from "next/link";
import { Eye, Trash2, Calendar, Building2, MapPin, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSessionFromCookies } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ApplicationsPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const applications = await prisma.jobApplication.findMany({
    where: { userId: session.sub },
    include: {
      jobOpportunity: {
        include: {
          company: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const statusColors = {
    APPLIED: "bg-blue-100 text-blue-800",
    SHORTLISTED: "bg-purple-100 text-purple-800",
    INTERVIEW: "bg-yellow-100 text-yellow-800",
    OFFERED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    ACCEPTED: "bg-emerald-100 text-emerald-800",
    WITHDRAWN: "bg-slate-100 text-slate-800",
  };

  const statusLabels: Record<string, string> = {
    APPLIED: "Applied",
    SHORTLISTED: "Shortlisted",
    INTERVIEW: "Interview",
    OFFERED: "Offer Received",
    REJECTED: "Not Selected",
    ACCEPTED: "Accepted",
    WITHDRAWN: "Withdrawn",
  };

  return (
    <>
      <header className="rounded-4xl relative overflow-hidden border border-slate-200 bg-gradient-to-br from-amber-50 to-slate-50 p-8 shadow-lg shadow-slate-200/70">
        <div className="absolute -right-16 top-6 h-48 w-48 rounded-full bg-gradient-to-br from-amber-500/10 to-orange-400/10 blur-3xl" />
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.45em] text-slate-500">Career Progress</p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-900 sm:text-5xl">
            My Applications
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-600">
            Track your job applications and follow up on opportunities.
          </p>
        </div>
      </header>

      <section>
        {applications.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No applications yet</h3>
            <p className="text-slate-600 mb-6">
              Find and apply to jobs to start your career journey
            </p>
            <Button asChild>
              <Link href="/jobs">Browse Jobs</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => {
              const job = application.jobOpportunity;
              const statusColor = statusColors[application.status as keyof typeof statusColors] || statusColors.APPLIED;
              const statusLabel = statusLabels[application.status] || "Applied";
              
              return (
                <div
                  key={application.id}
                  className="rounded-lg border border-slate-200 bg-white p-6 hover:shadow-md transition-shadow"
                >
                  <div className="grid gap-6 md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-2">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="text-xl font-semibold text-slate-900">
                            {job.title}
                          </h3>
                          <p className="text-slate-600 mt-1 flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {job.company.name}
                          </p>
                        </div>
                        <Badge className={statusColor}>
                          {statusLabel}
                        </Badge>
                      </div>

                      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 text-sm mb-4">
                        <div>
                          <p className="text-slate-500">Location</p>
                          <p className="font-medium text-slate-900 flex items-center gap-1 mt-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Type</p>
                          <p className="font-medium text-slate-900 mt-1">{job.jobType}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Applied</p>
                          <p className="font-medium text-slate-900 flex items-center gap-1 mt-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(application.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Salary Range</p>
                          <p className="font-medium text-slate-900 mt-1">
                            {job.salaryMin && job.salaryMax
                              ? `$${(job.salaryMin / 1000).toFixed(0)}k - $${(job.salaryMax / 1000).toFixed(0)}k`
                              : "Competitive"}
                          </p>
                        </div>
                      </div>

                      <p className="text-slate-600 line-clamp-2">
                        {job.description}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link href={`/jobs/${job.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Job
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link
                          href={job.company.website || `/${job.company.slug}`}
                          target="_blank"
                        >
                          <Building2 className="h-4 w-4 mr-2" />
                          Company
                        </Link>
                      </Button>
                      {application.status !== "WITHDRAWN" && (
                        <Button
                          variant="outline"
                          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Withdraw
                        </Button>
                      )}
                    </div>
                  </div>

                  {application.coverLetter && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-sm font-medium text-slate-600 mb-2">Cover Letter</p>
                      <p className="text-sm text-slate-700 line-clamp-3">
                        {application.coverLetter}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold mb-4">Application Statistics</h3>
          <div className="space-y-3">
            {Object.entries(statusLabels).map(([status, label]) => {
              const count = applications.filter(
                (app) => app.status === status
              ).length;
              if (count === 0) return null;
              return (
                <div
                  key={status}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-slate-600">{label}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link
              href="/jobs"
              className="block p-3 rounded-md bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors"
            >
              Browse More Jobs
            </Link>
            <Link
              href="/resumes"
              className="block p-3 rounded-md bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors"
            >
              Update Resume
            </Link>
            <Link
              href="/dashboard"
              className="block p-3 rounded-md bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
