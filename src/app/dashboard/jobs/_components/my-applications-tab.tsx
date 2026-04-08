"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Eye,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MyApplicationsTabProps {
  userId: string;
}

interface JobApplication {
  id: string;
  status: "SUBMITTED" | "IN_REVIEW" | "INTERVIEW" | "OFFERED" | "REJECTED";
  submittedAt: string;
  opportunity: {
    id: string;
    title: string;
    company: string;
    location: string;
    jobType: string;
    salaryRange?: string;
    description: string;
    slug: string;
  };
}

export function MyApplicationsTab({ userId }: MyApplicationsTabProps) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const statusColors: Record<string, string> = {
    SUBMITTED: "bg-blue-100 text-blue-800 border-blue-300",
    IN_REVIEW: "bg-purple-100 text-purple-800 border-purple-300",
    INTERVIEW: "bg-yellow-100 text-yellow-800 border-yellow-300",
    OFFERED: "bg-green-100 text-green-800 border-green-300",
    REJECTED: "bg-red-100 text-red-800 border-red-300",
  };

  const statusLabels: Record<string, string> = {
    SUBMITTED: "Applied",
    IN_REVIEW: "Under Review",
    INTERVIEW: "Interview",
    OFFERED: "Offer Received",
    REJECTED: "Not Selected",
  };

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/applications?userId=${userId}`);
        const data = await response.json();
        setApplications(data.applications || []);
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
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
    );
  }

  if (applications.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-12 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mb-4">
          <AlertCircle className="h-6 w-6 text-slate-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          No applications yet
        </h3>
        <p className="text-slate-600 mb-6">
          Find and apply to jobs to start tracking your applications.
        </p>
        <Button asChild>
          <Link href="/dashboard/jobs?tab=browse">
            Browse Jobs
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => {
        const job = application.opportunity;
        const statusColor =
          statusColors[application.status] ||
          statusColors.SUBMITTED;
        const statusLabel = statusLabels[application.status] || "Applied";

        return (
          <div
            key={application.id}
            className="rounded-xl border border-slate-200 bg-white p-6 hover:shadow-md transition-shadow"
          >
            <div className="grid gap-6 md:grid-cols-3 md:gap-8">
              <div className="md:col-span-2">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {job.title}
                    </h3>
                    <p className="text-slate-600 mt-1 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {job.company}
                    </p>
                  </div>
                  <Badge className={`border ${statusColor}`}>
                    {statusLabel}
                  </Badge>
                </div>

                <div className="grid gap-4 grid-cols-2 md:grid-cols-4 text-sm mb-4">
                  <div>
                    <p className="text-slate-500 text-xs">Location</p>
                    <p className="font-medium text-slate-900 flex items-center gap-1 mt-1">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Type</p>
                    <p className="font-medium text-slate-900 mt-1">
                      {job.jobType?.replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Applied</p>
                    <p className="font-medium text-slate-900 flex items-center gap-1 mt-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(application.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Salary Range</p>
                    <p className="font-medium text-slate-900 mt-1">
                      {job.salaryRange || "Competitive"}
                    </p>
                  </div>
                </div>

                <p className="text-slate-600 text-sm line-clamp-2">
                  {job.description}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href={`/jobs/${job.slug}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Job
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    title="Company profile coming soon"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Company
                  </Link>
                </Button>
                {application.status === "SUBMITTED" && (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      console.log("Withdraw application:", application.id);
                    }}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Withdraw
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Summary */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <p className="text-sm text-slate-600">
          Total applications: <span className="font-semibold text-slate-900">{applications.length}</span>
        </p>
      </div>
    </div>
  );
}
