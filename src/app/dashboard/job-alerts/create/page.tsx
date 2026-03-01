import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function createJobAlertAction(formData: FormData) {
  "use server";

  const keywords = String(formData.get("keywords") ?? "").trim().split(",").filter(Boolean);
  const location = String(formData.get("location") ?? "").trim();
  const jobType = String(formData.get("jobType") ?? "").trim();

  if (keywords.length === 0) {
    return { error: "Please enter at least one keyword" };
  }

  try {
    // TODO: Create job alert once migration is complete
    console.log("Creating job alert:", { keywords, location, jobType });
    return { success: true };
  } catch (error) {
    console.error("Error creating job alert:", error);
    return { error: "Failed to create job alert" };
  }
}

export default function CreateJobAlertPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/job-alerts" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Alerts
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Job Alert</h1>
          <p className="text-gray-600 mt-1">
            Set up a new alert to get notified about matching job opportunities
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alert Details</CardTitle>
          <CardDescription>
            Configure your job alert preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createJobAlertAction} className="space-y-6">
            {/* Keywords */}
            <div>
              <Label htmlFor="keywords">Keywords *</Label>
              <Textarea
                id="keywords"
                name="keywords"
                placeholder="Enter keywords separated by commas (e.g., React, JavaScript, Frontend)"
                rows={3}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter job titles, skills, or keywords you're interested in
              </p>
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                name="location"
                placeholder="e.g., New York, Remote, San Francisco"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank to get alerts from all locations
              </p>
            </div>

            {/* Job Type */}
            <div>
              <Label htmlFor="jobType">Job Type (Optional)</Label>
              <Select name="jobType">
                <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="FULL_TIME">Full Time</SelectItem>
                  <SelectItem value="PART_TIME">Part Time</SelectItem>
                  <SelectItem value="CONTRACT">Contract</SelectItem>
                  <SelectItem value="INTERNSHIP">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Frequency */}
            <div>
              <Label htmlFor="frequency">Notification Frequency</Label>
              <Select defaultValue="daily">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediately">Immediately</SelectItem>
                  <SelectItem value="daily">Daily Digest</SelectItem>
                  <SelectItem value="weekly">Weekly Digest</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                How often you want to receive notifications
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button type="submit">Create Alert</Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/job-alerts">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tips for Better Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold">Be Specific</h4>
            <p className="text-gray-600">Use specific keywords like "React Developer" instead of just "Developer"</p>
          </div>
          <div>
            <h4 className="font-semibold">Include Location</h4>
            <p className="text-gray-600">Specify your preferred location to get more relevant results</p>
          </div>
          <div>
            <h4 className="font-semibold">Multiple Alerts</h4>
            <p className="text-gray-600">Create multiple alerts for different roles or locations</p>
          </div>
          <div>
            <h4 className="font-semibold">Review Regularly</h4>
            <p className="text-gray-600">Update your alerts as your preferences change</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
