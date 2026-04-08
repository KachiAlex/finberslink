import { notFound } from "next/navigation";
import { ArrowLeft, Briefcase, MapPin, Globe, Users, Building } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCompanyBySlug, getCompanyJobs, getCompanyStats } from "@/features/jobs/company.service";
import { JobCard } from "@/app/jobs/_components/job-card";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [company, jobs, stats] = await Promise.all([
    getCompanyBySlug(slug),
    getCompanyJobs(""), // Will be updated when company FK is added
    getCompanyStats(""), // Will be updated when company FK is added
  ]);

  if (!company) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/companies" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Companies
            </Link>
          </Button>
        </div>

        {/* Company Header */}
        <Card className="mb-8">
          <CardHeader className="pb-6">
            <div className="flex items-start gap-6">
              {(company as any).logo && (
                <div className="h-24 w-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <img
                    src={(company as any).logo}
                    alt={(company as any).name}
                    className="h-full w-full object-cover rounded-lg"
                  />
                </div>
              )}
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{(company as any).name}</CardTitle>
                <CardDescription className="text-base mb-4">
                  {(company as any).description}
                </CardDescription>

                {/* Company Details */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  {(company as any).industry && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      <span>{(company as any).industry}</span>
                    </div>
                  )}
                  {(company as any).location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{(company as any).location}</span>
                    </div>
                  )}
                  {(company as any).website && (
                    <a
                      href={(company as any).website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      <Globe className="w-4 h-4" />
                      Visit Website
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Company Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.jobCount}</div>
                <div className="text-sm text-gray-600">Active Jobs</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.applicationCount}</div>
                <div className="text-sm text-gray-600">Applications</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.totalViews}</div>
                <div className="text-sm text-gray-600">Profile Views</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Open Positions */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Open Positions</h2>
          {jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.map((job: any) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Open Positions</h3>
                <p className="text-gray-600">
                  This company doesn't have any open positions at the moment.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Company Info Card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>About {(company as any).name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(company as any).description && (
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-gray-700">{(company as any).description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                {(company as any).industry && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600">Industry</h4>
                    <p className="text-gray-900">{(company as any).industry}</p>
                  </div>
                )}
                {(company as any).location && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600">Location</h4>
                    <p className="text-gray-900">{(company as any).location}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
