import Link from "next/link";
import { Search, MapPin, Briefcase, Clock, DollarSign, Building, Filter, Bookmark, ArrowRight, Star, Users, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getJobs, getFeaturedJobs, getPopularCompanies, getJobTags, listSavedJobs } from "@/features/jobs/service";
import { getSessionFromCookies } from "@/lib/auth/session";

import { JobCard } from "./_components/job-card";
import { JobFilters } from "./_components/job-filters";
import { CareerPulseSection } from "./_components/career-pulse";

type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
type RemoteOption = 'REMOTE' | 'HYBRID' | 'ONSITE';

export const dynamic = "force-dynamic";
export const revalidate = 0;

const jobTypeColors = {
  FULL_TIME: "bg-cyan-900/30 text-cyan-300 border-cyan-700/50",
  PART_TIME: "bg-emerald-900/30 text-emerald-300 border-emerald-700/50",
  CONTRACT: "bg-violet-900/30 text-violet-300 border-violet-700/50",
  INTERNSHIP: "bg-amber-900/30 text-amber-300 border-amber-700/50",
  FREELANCE: "bg-rose-900/30 text-rose-300 border-rose-700/50",
};

const remoteOptionColors = {
  ONSITE: "bg-slate-900/30 text-slate-300 border-slate-700/50",
  HYBRID: "bg-indigo-900/30 text-indigo-300 border-indigo-700/50",
  REMOTE: "bg-emerald-900/30 text-emerald-300 border-emerald-700/50",
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

  const session = await getSessionFromCookies();

  const [jobsData, featuredJobs, popularCompanies, jobTags, savedJobs] = await Promise.all([
    getJobs(filters),
    getFeaturedJobs(5),
    getPopularCompanies(8),
    getJobTags(),
    session ? listSavedJobs(session.sub) : Promise.resolve([]),
  ]);

  const savedJobIds = new Set(
    (savedJobs as Array<{ jobOpportunityId: string }>).map((save) => save.jobOpportunityId),
  );

  const savedJobOpportunities = (savedJobs as Array<{ jobOpportunity: any }>).
    map((save) => save.jobOpportunity).
    filter(Boolean).
    slice(0, 3);

  const topFeaturedJobs = featuredJobs.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section with Animated Orbs */}
      <div className="relative overflow-hidden border-b border-slate-700/50 bg-gradient-to-b from-slate-800 to-slate-900">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-20 h-80 w-80 rounded-full bg-cyan-600/20 blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-2 mb-6 border border-cyan-600/30">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-300">Find opportunities that match your goals</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
              Discover Your Next Role
            </h1>
            <p className="mt-6 text-lg text-slate-400">
              Browse thousands of opportunities from companies worldwide
            </p>
          </div>

          {/* Search Bar */}
          <div className="mt-10 max-w-3xl mx-auto">
            <form className="flex gap-3" method="GET">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <Input
                  name="search"
                  placeholder="Job title, company, or keywords..."
                  defaultValue={params.search}
                  className="pl-12 h-13 bg-slate-800/80 border-slate-700/50 text-white placeholder:text-slate-400 rounded-lg focus:border-cyan-500/50 focus:ring-cyan-500/20"
                />
              </div>
              <Button type="submit" size="lg" className="h-13 px-8 bg-cyan-600 hover:bg-cyan-700 rounded-lg">
                Search
              </Button>
            </form>
          </div>

          {/* Quick Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-300">{jobsData.pagination.total}+</div>
              <div className="text-sm text-slate-400 mt-1">Active roles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-300">{popularCompanies.length}+</div>
              <div className="text-sm text-slate-400 mt-1">Top companies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-300">Worldwide</div>
              <div className="text-sm text-slate-400 mt-1">Opportunities</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Career Pulse Section */}
        <div className="mb-16">
          <CareerPulseSection />
        </div>

        {/* Featured Spotlight */}
        {!params.search && !params.location && !params.jobType && !params.remoteOption && topFeaturedJobs.length > 0 && (
          <div className="mb-16">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-3">Featured Spotlight</h2>
              <p className="text-slate-400">Hand-picked opportunities matching your profile</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topFeaturedJobs.map((job: any) => (
                <div key={job.id} className="group relative rounded-2xl border border-cyan-600/30 bg-gradient-to-br from-slate-800/80 via-slate-800/50 to-slate-900/80 p-6 hover:border-cyan-500/50 hover:bg-gradient-to-br hover:from-slate-800 hover:via-slate-800/70 hover:to-slate-900 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-600/10">
                  {/* Gradient Header */}
                  <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-cyan-600/30 to-transparent top-0 rounded-t-2xl"></div>
                  
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <Badge className="mb-3 bg-cyan-600/20 text-cyan-300 border border-cyan-600/30">Featured</Badge>
                      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors">{job.title}</h3>
                      <p className="text-sm text-slate-400">{job.company}</p>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                      <Users className="h-3 w-3" />
                      {(job as any)._count?.applications || 0}
                    </div>
                  </div>

                  <div className="mb-6 space-y-2 text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      {job.location ?? job.remoteOption ?? "Remote"}
                    </div>
                    {job.salaryRange && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-slate-500" />
                        {job.salaryRange}
                      </div>
                    )}
                  </div>

                  <div className="mb-6 flex flex-wrap gap-2">
                    <Badge className={`border ${jobTypeColors[job.jobType as keyof typeof jobTypeColors]}`}>
                      {job.jobType.replace("_", " ")}
                    </Badge>
                    <Badge className={`border ${remoteOptionColors[job.remoteOption as keyof typeof remoteOptionColors]}`}>
                      {job.remoteOption.replace("_", " ")}
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild className="flex-1 border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-600/10 text-slate-300">
                      <Link href={`/jobs/${job.slug}`}>View Details</Link>
                    </Button>
                    <Button size="sm" asChild className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                      <Link href={`/jobs/${job.slug}/apply`}>Apply</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saved Jobs */}
        {session && savedJobOpportunities.length > 0 && (
          <div className="mb-16">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Saved for later</h2>
                <p className="text-slate-400">Your bookmarked opportunities</p>
              </div>
              <Badge className="bg-cyan-600/20 text-cyan-300 border border-cyan-600/30">
                <Bookmark className="mr-2 h-4 w-4" />
                {savedJobIds.size} Saved
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedJobOpportunities.map((save) => (
                <JobCard key={save.id} job={save} saved />
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <JobFilters
                currentFilters={filters}
                availableTags={jobTags.slice(0, 20)}
                popularCompanies={popularCompanies}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white">
                  {params.search || params.location || params.jobType || params.remoteOption
                    ? "Search Results"
                    : "All Opportunities"}
                </h2>
                <p className="text-slate-400 mt-2">
                  {jobsData.pagination.total} jobs found
                </p>
              </div>
            </div>

            {/* Job Listings */}
            {jobsData.jobs.length > 0 ? (
              <div className="space-y-4">
                {jobsData.jobs.map((job: any) => (
                  <JobCard key={job.id} job={job} saved={savedJobIds.has(job.id)} />
                ))}

                {/* Pagination */}
                {jobsData.pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-12 gap-2">
                    {Array.from({ length: jobsData.pagination.totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={page === jobsData.pagination.page ? "default" : "outline"}
                        size="sm"
                        asChild
                        className={page === jobsData.pagination.page ? "bg-cyan-600 hover:bg-cyan-700" : "border-slate-700 hover:border-slate-600"}
                      >
                        <Link href={`?page=${page}`}>
                          {page}
                        </Link>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-12 text-center">
                <Briefcase className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No jobs found</h3>
                <p className="text-slate-400 mb-6">
                  Try adjusting your search criteria or browse all opportunities.
                </p>
                <Button asChild className="bg-cyan-600 hover:bg-cyan-700">
                  <Link href="/jobs">Clear Filters</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
