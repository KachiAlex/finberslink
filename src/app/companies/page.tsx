import { Search, Building, Briefcase, MapPin, Globe } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCompanies } from "@/features/jobs/company.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const filters = {
    search: params.search,
    page: params.page ? parseInt(params.page) : 1,
    limit: 20,
  };

  const { companies, pagination } = await getCompanies(filters);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Explore Companies
            </h1>
            <p className="mt-4 text-lg text-indigo-100">
              Discover leading employers and their job opportunities
            </p>
          </div>

          {/* Search Bar */}
          <div className="mt-8 max-w-2xl mx-auto">
            <form className="flex gap-2" method="GET">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  name="search"
                  placeholder="Search companies, industries..."
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

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Results Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {params.search ? "Search Results" : "All Companies"}
          </h2>
          <p className="text-gray-600">
            {pagination.total} companies found
          </p>
        </div>

        {/* Companies Grid */}
        {companies.length > 0 ? (
          <div className="space-y-6">
            {/* Company Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {companies.map((company: any) => (
                <Card key={company.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    {company.logo && (
                      <div className="mb-4 h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <img
                          src={company.logo}
                          alt={company.name}
                          className="h-full w-full object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <CardTitle className="text-lg">{company.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {company.description || "No description available"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Company Details */}
                    <div className="space-y-2 text-sm text-gray-600">
                      {company.industry && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          <span>{company.industry}</span>
                        </div>
                      )}
                      {company.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{company.location}</span>
                        </div>
                      )}
                      {company.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate"
                          >
                            Visit Website
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Job Count Badge */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <Badge variant="secondary">
                        {company._count.jobs} {company._count.jobs === 1 ? "Job" : "Jobs"}
                      </Badge>
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/companies/${company.slug}`}>
                          View Profile
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex gap-2">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={page === pagination.page ? "default" : "outline"}
                      size="sm"
                      asChild
                    >
                      <a href={`?page=${page}${params.search ? `&search=${params.search}` : ""}`}>
                        {page}
                      </a>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or browse all companies.
              </p>
              <Button variant="outline" asChild>
                <Link href="/companies">Clear Search</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
