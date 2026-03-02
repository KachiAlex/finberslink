import { Search, MapPin, Briefcase, Clock, DollarSign, Building, Filter } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getJobs, getFeaturedJobs, getPopularCompanies, getJobTags } from "@/features/jobs/service";

type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
type RemoteOption = 'REMOTE' | 'HYBRID' | 'ONSITE';

import { JobCard } from "./_components/job-card";
import { JobFilters } from "./_components/job-filters";

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
  ON_SITE: "bg-red-100 text-red-800",
  HYBRID: "bg-indigo-100 text-indigo-800",
  REMOTE: "bg-emerald-100 text-emerald-800",
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    location?: string;
    jobType?: JobType;
    remoteOption?: RemoteOption;
    company?: string;
    tags?: string;
    page?: string;
    featured?: string;
  }>;
}) {
  const params = await searchParams;
  const filters = {
    search: params.search,
    location: params.location,
    jobType: params.jobType,
    remoteOption: params.remoteOption,
    company: params.company,
    tags: params.tags?.split(",").filter(Boolean),
    featured: params.featured === "true",
    page: params.page ? parseInt(params.page) : 1,
  };

  const [jobsData, featuredJobs, popularCompanies, jobTags] = await Promise.all([
    getJobs(filters),
    getFeaturedJobs(5),
    getPopularCompanies(8),
    getJobTags(),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Find Your Dream Job
            </h1>
            <p className="mt-4 text-lg text-blue-100">
              Discover opportunities from top companies and startups
            </p>
          </div>

          {/* Search Bar */}
          <div className="mt-8 max-w-3xl mx-auto">
            <form className="flex gap-2" method="GET">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  name="search"
                  placeholder="Search jobs, companies, or keywords..."
                  defaultValue={params.search}
                  className="pl-10 h-12 text-base"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-8">
                Search
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <JobFilters
              currentFilters={filters}
              availableTags={jobTags.slice(0, 20)}
              popularCompanies={popularCompanies}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Featured Jobs */}
            {!params.search && !params.location && !params.jobType && !params.remoteOption && featuredJobs.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured Opportunities</h2>
                <div className="grid gap-4">
                  {featuredJobs.map((job: any) => (
                    <JobCard key={job.id} job={job} featured={true} />
                  ))}
                </div>
              </div>
            )}

            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {params.search || params.location || params.jobType || params.remoteOption
                    ? "Search Results"
                    : "All Opportunities"}
                </h2>
                <p className="text-gray-600">
                  {jobsData.pagination.total} jobs found
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </div>
            </div>

            {/* Job Listings */}
            {jobsData.jobs.length > 0 ? (
              <div className="space-y-4">
                {jobsData.jobs.map((job: any) => (
                  <JobCard key={job.id} job={job} />
                ))}

                {/* Pagination */}
                {jobsData.pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <div className="flex gap-2">
                      {Array.from({ length: jobsData.pagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={page === jobsData.pagination.page ? "default" : "outline"}
                          size="sm"
                          asChild
                        >
                          <a href={`?page=${page}`}>
                            {page}
                          </a>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or browse all opportunities.
                </p>
                <Button variant="outline" asChild>
                  <a href="/jobs">Clear Filters</a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
