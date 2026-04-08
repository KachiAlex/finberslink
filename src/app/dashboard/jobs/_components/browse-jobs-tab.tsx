"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Search,
  MapPin,
  DollarSign,
  Filter,
  Bookmark,
  ArrowRight,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";

interface JobFilters {
  search?: string;
  location?: string;
  jobType?: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
  remoteOption?: "REMOTE" | "HYBRID" | "ONSITE";
  company?: string;
  tags?: string[];
  featured?: boolean;
  page?: number;
}

interface BrowseJobsTabProps {
  filters: JobFilters;
  userId: string;
}

export function BrowseJobsTab({ filters, userId }: BrowseJobsTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 10 });

  const jobTypeColors: Record<string, string> = {
    FULL_TIME: "bg-cyan-100 text-cyan-800 border-cyan-300",
    PART_TIME: "bg-emerald-100 text-emerald-800 border-emerald-300",
    CONTRACT: "bg-violet-100 text-violet-800 border-violet-300",
    INTERNSHIP: "bg-amber-100 text-amber-800 border-amber-300",
    FREELANCE: "bg-rose-100 text-rose-800 border-rose-300",
  };

  const remoteOptionColors: Record<string, string> = {
    ONSITE: "bg-slate-100 text-slate-800 border-slate-300",
    HYBRID: "bg-indigo-100 text-indigo-800 border-indigo-300",
    REMOTE: "bg-emerald-100 text-emerald-800 border-emerald-300",
  };

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (filters.search) queryParams.append("search", filters.search);
        if (filters.location) queryParams.append("location", filters.location);
        if (filters.jobType) queryParams.append("jobType", filters.jobType);
        if (filters.remoteOption)
          queryParams.append("remoteOption", filters.remoteOption);
        if (filters.company) queryParams.append("company", filters.company);
        if (filters.tags?.length) queryParams.append("tags", filters.tags.join(","));
        if (filters.featured) queryParams.append("featured", "true");
        if (filters.page) queryParams.append("page", filters.page.toString());

        const response = await fetch(
          `/api/jobs/search?${queryParams.toString()}`
        );
        const data = await response.json();
        setJobs(data.jobs || []);
        setPagination(data.pagination || { total: 0, page: 1, pageSize: 10 });
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [filters]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams(searchParams.toString());

    if (formData.get("search")) {
      params.set("search", formData.get("search") as string);
    } else {
      params.delete("search");
    }

    router.push(`/dashboard/jobs?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input
            name="search"
            placeholder="Job title, company, or keywords..."
            defaultValue={filters.search || ""}
            className="pl-12 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <Button type="submit" className="h-11 px-8">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </form>

      {/* Filter Info */}
      <div className="flex flex-wrap gap-2 items-center">
        {filters.search && (
          <Badge variant="secondary">Search: {filters.search}</Badge>
        )}
        {filters.location && (
          <Badge variant="secondary">Location: {filters.location}</Badge>
        )}
        {filters.jobType && (
          <Badge variant="secondary">Type: {filters.jobType}</Badge>
        )}
        {filters.remoteOption && (
          <Badge variant="secondary">
            Remote: {filters.remoteOption}
          </Badge>
        )}
        {(filters.search || filters.location || filters.jobType || filters.remoteOption) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/jobs")}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-white p-6 animate-pulse"
            >
              <div className="h-6 bg-slate-200 rounded w-48 mb-3" />
              <div className="h-4 bg-slate-100 rounded w-32 mb-4" />
              <div className="flex gap-2">
                <div className="h-6 bg-slate-100 rounded w-24" />
                <div className="h-6 bg-slate-100 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-12 text-center">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No jobs found
          </h3>
          <p className="text-slate-600 mb-4">
            Try adjusting your search filters or browse all opportunities.
          </p>
          <Button variant="outline" onClick={() => router.push("/dashboard/jobs")}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job: any) => (
            <div
              key={job.id}
              className="rounded-xl border border-slate-200 bg-white p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 hover:text-blue-600">
                    <Link href={`/jobs/${job.slug}`}>{job.title}</Link>
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">{job.company}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-blue-600"
                >
                  <Bookmark className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-4 text-sm mb-4">
                {job.location && (
                  <div className="flex items-center gap-1 text-slate-600">
                    <MapPin className="h-4 w-4" />
                    {job.location}
                  </div>
                )}
                {job.salaryRange && (
                  <div className="flex items-center gap-1 text-slate-600">
                    <DollarSign className="h-4 w-4" />
                    {job.salaryRange}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge
                  className={`border ${
                    jobTypeColors[job.jobType] || "bg-slate-100 text-slate-800"
                  }`}
                  variant="outline"
                >
                  {job.jobType?.replace("_", " ") || "Full Time"}
                </Badge>
                {job.remoteOption && (
                  <Badge
                    className={`border ${
                      remoteOptionColors[job.remoteOption] ||
                      "bg-slate-100 text-slate-800"
                    }`}
                    variant="outline"
                  >
                    {job.remoteOption.replace("_", " ")}
                  </Badge>
                )}
              </div>

              <p className="text-slate-600 text-sm line-clamp-2 mb-4">
                {job.description}
              </p>

              <Button asChild>
                <Link href={`/jobs/${job.slug}`}>
                  View & Apply
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Info */}
      {pagination.total > 0 && (
        <div className="text-center text-sm text-slate-600">
          Showing {jobs.length} of {pagination.total} jobs
        </div>
      )}
    </div>
  );
}
