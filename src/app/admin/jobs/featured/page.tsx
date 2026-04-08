import { Star, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getJobs } from "@/features/jobs/service";
import { AdminShell } from "../../_components/admin-shell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function toggleFeaturedAction(formData: FormData) {
  "use server";

  const jobId = String(formData.get("jobId")).trim();
  const isFeatured = formData.get("isFeatured") === "true";

  if (!jobId) {
    return;
  }

  try {
    // TODO: Update job featured status once migration is complete
    console.log(`Toggling featured status for job ${jobId} to ${!isFeatured}`);
  } catch (error) {
    console.error("Error toggling featured status:", error);
  }
}

export default async function FeaturedJobsPage() {
  const { jobs } = await getJobs({ limit: 1000 });

  // TODO: Filter featured jobs once field is available in schema
  const featuredJobs: typeof jobs = [];
  const availableJobs = jobs;

  return (
    <div className="space-y-6">
      <AdminShell
        title="Featured Jobs"
        description="Manage which job postings are featured on the job board"
      >
        {/* Featured Jobs Limit Info */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              You can feature up to 5 jobs at a time. Featured jobs appear at the top of the job board and get more visibility.
            </p>
          </CardContent>
        </Card>

        {/* Currently Featured */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Currently Featured ({featuredJobs.length}/5)</h2>
          {featuredJobs.length > 0 ? (
            <div className="space-y-3">
              {featuredJobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        <div>
                          <h4 className="font-semibold">{job.title}</h4>
                          <p className="text-sm text-gray-600">{job.company}</p>
                        </div>
                      </div>
                      <form action={toggleFeaturedAction}>
                        <input type="hidden" name="jobId" value={job.id} />
                        <input type="hidden" name="isFeatured" value="true" />
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-3 h-3 mr-1" />
                          Remove
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Star className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No featured jobs yet</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Available Jobs to Feature */}
        {featuredJobs.length < 5 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Available Jobs ({availableJobs.length})
            </h2>
            {availableJobs.length > 0 ? (
              <div className="space-y-3">
                {availableJobs.slice(0, 20).map((job) => (
                  <Card key={job.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{job.title}</h4>
                          <p className="text-sm text-gray-600">
                            {job.company} • {job.location}
                          </p>
                        </div>
                        <form action={toggleFeaturedAction}>
                          <input type="hidden" name="jobId" value={job.id} />
                          <input type="hidden" name="isFeatured" value="false" />
                          <Button variant="default" size="sm">
                            <Star className="w-3 h-3 mr-1" />
                            Feature
                          </Button>
                        </form>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-600">No jobs available to feature</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Benefits Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Benefits of Featured Jobs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold">Increased Visibility</h4>
              <p className="text-gray-600">Featured jobs appear at the top of the job board</p>
            </div>
            <div>
              <h4 className="font-semibold">More Applications</h4>
              <p className="text-gray-600">Get more qualified candidates for your open positions</p>
            </div>
            <div>
              <h4 className="font-semibold">Priority Placement</h4>
              <p className="text-gray-600">Featured jobs are highlighted with a special badge</p>
            </div>
          </CardContent>
        </Card>
      </AdminShell>
    </div>
  );
}
