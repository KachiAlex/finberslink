import { BarChart3, TrendingUp, Briefcase, Users, Clock, CheckCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getJobs, getJobApplicationsForAdmin } from "@/features/jobs/service";
import { AdminShell } from "../../_components/admin-shell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function JobAnalyticsPage() {
  const [jobsData, allApplications] = await Promise.all([
    getJobs({ limit: 1000 }),
    getJobApplicationsForAdmin(),
  ]);

  const jobs = jobsData.jobs;

  // Calculate analytics
  const totalJobs = jobs.length;
  const activeJobs = jobs.length; // All jobs in the list are considered active
  const totalApplications = allApplications.length;
  const avgApplicationsPerJob = totalJobs > 0 ? Math.round(totalApplications / totalJobs) : 0;

  // Application status breakdown
  const statusBreakdown = {
    SUBMITTED: allApplications.filter(a => a.status === "SUBMITTED").length,
    REVIEWING: allApplications.filter(a => a.status === "REVIEWING").length,
    INTERVIEW: allApplications.filter(a => a.status === "INTERVIEW").length,
    OFFER: allApplications.filter(a => a.status === "OFFER").length,
    REJECTED: allApplications.filter(a => a.status === "REJECTED").length,
  };

  // Top jobs by applications
  const topJobs = jobs
    .map(job => ({
      ...job,
      applicationCount: allApplications.filter(a => a.jobOpportunityId === job.id).length,
    }))
    .sort((a, b) => b.applicationCount - a.applicationCount)
    .slice(0, 5);

  // Job type distribution
  const jobTypeDistribution = jobs.reduce(
    (acc, job) => {
      acc[job.jobType] = (acc[job.jobType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Remote option distribution
  const remoteDistribution = jobs.reduce(
    (acc, job) => {
      acc[job.remoteOption] = (acc[job.remoteOption] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <AdminShell
        title="Job Analytics"
        description="Track job postings, applications, and hiring metrics"
      >
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                Total Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalJobs}</div>
              <p className="text-xs text-gray-600 mt-1">
                {activeJobs} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600" />
                Total Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalApplications}</div>
              <p className="text-xs text-gray-600 mt-1">
                {avgApplicationsPerJob} avg per job
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                Under Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusBreakdown.REVIEWING}</div>
              <p className="text-xs text-gray-600 mt-1">
                {totalApplications > 0 ? Math.round((statusBreakdown.REVIEWING / totalApplications) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-purple-600" />
                Offers Made
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusBreakdown.OFFER}</div>
              <p className="text-xs text-gray-600 mt-1">
                {totalApplications > 0 ? Math.round((statusBreakdown.OFFER / totalApplications) * 100) : 0}% conversion
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Application Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Application Status Distribution</CardTitle>
            <CardDescription>
              Breakdown of all applications by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(statusBreakdown).map(([status, count]) => {
                const percentage = totalApplications > 0 ? Math.round((count / totalApplications) * 100) : 0;
                const statusColors = {
                  SUBMITTED: "bg-blue-100",
                  REVIEWING: "bg-yellow-100",
                  INTERVIEW: "bg-indigo-100",
                  OFFER: "bg-green-100",
                  REJECTED: "bg-red-100",
                };

                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{status.replace("_", " ")}</span>
                      <span className="text-sm text-gray-600">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${statusColors[status as keyof typeof statusColors]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Job Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Jobs by Type</CardTitle>
              <CardDescription>
                Distribution of job postings by employment type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(jobTypeDistribution).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <Badge variant="outline">{type.replace("_", " ")}</Badge>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Remote Option Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Work Type Distribution</CardTitle>
              <CardDescription>
                Distribution of job postings by work location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(remoteDistribution).map(([option, count]) => (
                  <div key={option} className="flex items-center justify-between">
                    <Badge variant="outline">{option}</Badge>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Jobs by Applications */}
        <Card>
          <CardHeader>
            <CardTitle>Top Jobs by Applications</CardTitle>
            <CardDescription>
              Most popular job postings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topJobs.length > 0 ? (
                topJobs.map((job, index) => (
                  <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-700">#{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{job.title}</h4>
                        <p className="text-xs text-gray-600">{job.company}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{job.applicationCount}</div>
                      <p className="text-xs text-gray-600">applications</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No jobs posted yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Recently Posted Jobs</CardTitle>
            <CardDescription>
              Latest job postings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {jobs.slice(0, 10).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-semibold text-sm">{job.title}</h4>
                    <p className="text-xs text-gray-600">
                      {job.company} • {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="default">
                    Active
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </AdminShell>
    </div>
  );
}
