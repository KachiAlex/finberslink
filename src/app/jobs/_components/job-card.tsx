import { MapPin, Briefcase, Clock, DollarSign, Building, Users, Eye } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { JobType, RemoteOption } from "@prisma/client";

interface JobCardProps {
  job: {
    id: string;
    slug: string;
    title: string;
    company: string;
    location: string;
    country: string;
    jobType: JobType;
    remoteOption: RemoteOption;
    salaryRange?: string;
    description?: string;
    tags: string[];
    createdAt: string;
    _count: {
      applications: number;
    };
  };
  featured?: boolean;
}

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

export function JobCard({ job, featured = false }: JobCardProps) {
  return (
    <Card className={`hover:shadow-lg transition-shadow ${featured ? 'border-2 border-blue-200 bg-blue-50/30' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {featured && (
                <Badge className="bg-blue-600 text-white">
                  Featured
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl mb-1">
              <Link 
                href={`/jobs/${job.slug}`}
                className="hover:text-blue-600 transition-colors"
              >
                {job.title}
              </Link>
            </CardTitle>
            <CardDescription className="text-base font-medium text-gray-700">
              {job.company}
            </CardDescription>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {job._count.applications}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Job Details */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {job.location}, {job.country}
          </div>
          <div className="flex items-center gap-1">
            <Briefcase className="w-4 h-4" />
            <Badge className={jobTypeColors[job.jobType]}>
              {job.jobType.replace("_", " ")}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <Badge className={remoteOptionColors[job.remoteOption]}>
              {job.remoteOption.replace("_", " ")}
            </Badge>
          </div>
          {job.salaryRange && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span>{job.salaryRange}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {job.description && (
          <p className="text-sm text-gray-700 line-clamp-2">
            {job.description}
          </p>
        )}

        {/* Tags */}
        {job.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {job.tags.slice(0, 5).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {job.tags.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{job.tags.length - 5} more
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="text-xs text-gray-500">
            Posted {new Date(job.createdAt).toLocaleDateString()}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/jobs/${job.slug}`}>
                View Details
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={`/jobs/${job.slug}/apply`}>
                Apply Now
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
