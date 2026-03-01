"use client";

import { Building, MapPin, Briefcase, Clock, X, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
type RemoteOption = 'REMOTE' | 'HYBRID' | 'ONSITE';

interface JobFiltersProps {
  currentFilters: {
    search?: string;
    location?: string;
    jobType?: JobType;
    remoteOption?: RemoteOption;
    company?: string;
    tags?: string[];
    featured?: boolean;
  };
  availableTags: Array<{ tag: string; count: number }>;
  popularCompanies: Array<{ name: string; jobCount: number }>;
}

const jobTypes: JobType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'];
const remoteOptions: RemoteOption[] = ['REMOTE', 'HYBRID', 'ONSITE'];

export function JobFilters({ currentFilters, availableTags, popularCompanies }: JobFiltersProps) {
  const [expandedSections, setExpandedSections] = useState({
    jobType: true,
    remoteOption: true,
    tags: false,
    companies: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const buildUrl = (newFilters: Partial<typeof currentFilters>) => {
    const params = new URLSearchParams();
    
    Object.entries({ ...currentFilters, ...newFilters }).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value)) {
          params.set(key, value.join(","));
        } else {
          params.set(key, String(value));
        }
      }
    });

    const queryString = params.toString();
    return queryString ? `/jobs?${queryString}` : "/jobs";
  };

  const clearAllFilters = () => {
    return "/jobs";
  };

  const hasActiveFilters = !!(
    currentFilters.location ||
    currentFilters.jobType ||
    currentFilters.remoteOption ||
    currentFilters.company ||
    (currentFilters.tags && currentFilters.tags.length > 0) ||
    currentFilters.featured
  );

  return (
    <div className="space-y-6">
      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium">Active Filters</span>
          <Button variant="ghost" size="sm" asChild>
            <Link href={clearAllFilters()}>
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Link>
          </Button>
        </div>
      )}

      {/* Location Filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" className="space-y-3">
            <Input
              name="location"
              placeholder="City, country, or remote..."
              defaultValue={currentFilters.location}
            />
            <Button type="submit" className="w-full">
              Update Location
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Job Type Filter */}
      <Card>
        <CardHeader className="pb-3">
          <button
            onClick={() => toggleSection("jobType")}
            className="flex items-center justify-between w-full text-left"
          >
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Job Type
            </CardTitle>
            {expandedSections.jobType ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </CardHeader>
        {expandedSections.jobType && (
          <CardContent>
            <div className="space-y-2">
              {jobTypes.map((type) => (
                <Link
                  key={type}
                  href={buildUrl({ jobType: currentFilters.jobType === type ? undefined : type })}
                  className="block"
                >
                  <div
                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                      currentFilters.jobType === type
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-sm font-medium">
                      {type.replace("_", " ")}
                    </span>
                    {currentFilters.jobType === type && (
                      <X className="w-3 h-3" />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Remote Option Filter */}
      <Card>
        <CardHeader className="pb-3">
          <button
            onClick={() => toggleSection("remoteOption")}
            className="flex items-center justify-between w-full text-left"
          >
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Work Type
            </CardTitle>
            {expandedSections.remoteOption ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </CardHeader>
        {expandedSections.remoteOption && (
          <CardContent>
            <div className="space-y-2">
              {remoteOptions.map((option) => (
                <Link
                  key={option}
                  href={buildUrl({ remoteOption: currentFilters.remoteOption === option ? undefined : option })}
                  className="block"
                >
                  <div
                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                      currentFilters.remoteOption === option
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-sm font-medium">
                      {option.replace("_", " ")}
                    </span>
                    {currentFilters.remoteOption === option && (
                      <X className="w-3 h-3" />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Popular Companies */}
      <Card>
        <CardHeader className="pb-3">
          <button
            onClick={() => toggleSection("companies")}
            className="flex items-center justify-between w-full text-left"
          >
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="w-5 h-5" />
              Popular Companies
            </CardTitle>
            {expandedSections.companies ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </CardHeader>
        {expandedSections.companies && (
          <CardContent>
            <div className="space-y-2">
              {popularCompanies.map((company) => (
                <Link
                  key={company.name}
                  href={buildUrl({ company: currentFilters.company === company.name ? undefined : company.name })}
                  className="block"
                >
                  <div
                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                      currentFilters.company === company.name
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {company.name}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {company.jobCount}
                      </Badge>
                    </div>
                    {currentFilters.company === company.name && (
                      <X className="w-3 h-3" />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Popular Tags */}
      <Card>
        <CardHeader className="pb-3">
          <button
            onClick={() => toggleSection("tags")}
            className="flex items-center justify-between w-full text-left"
          >
            <CardTitle className="text-lg">Popular Tags</CardTitle>
            {expandedSections.tags ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </CardHeader>
        {expandedSections.tags && (
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(({ tag, count }) => {
                const isSelected = currentFilters.tags?.includes(tag);
                const newTags = isSelected
                  ? currentFilters.tags?.filter(t => t !== tag) || []
                  : [...(currentFilters.tags || []), tag];

                return (
                  <Link key={tag} href={buildUrl({ tags: newTags })}>
                    <Badge
                      variant={isSelected ? "default" : "secondary"}
                      className="cursor-pointer hover:bg-blue-100"
                    >
                      {tag}
                      <span className="ml-1 text-xs opacity-70">({count})</span>
                    </Badge>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Featured Jobs Toggle */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href={buildUrl({ featured: currentFilters.featured ? undefined : true })}>
            <div
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                currentFilters.featured
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <span className="text-sm font-medium">Featured Jobs Only</span>
              {currentFilters.featured && <X className="w-3 h-3" />}
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
