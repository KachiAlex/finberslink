import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Gradient Text Component
const GradientText = ({ children }: { children: React.ReactNode }) => (
  <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
    {children}
  </span>
);

async function createJobAlertAction(formData: FormData) {
  "use server";

  const keywords = String(formData.get("keywords") ?? "").trim().split(",").filter(Boolean);
  const location = String(formData.get("location") ?? "").trim();
  const jobType = String(formData.get("jobType") ?? "").trim();

  if (keywords.length === 0) {
    console.error("No keywords provided");
    return;
  }

  try {
    // TODO: Create job alert once migration is complete
    console.log("Creating job alert:", { keywords, location, jobType });
  } catch (error) {
    console.error("Error creating job alert:", error);
  }
}

export default function CreateJobAlertPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild className="hover:bg-slate-100 rounded-full w-10 h-10 p-0">
          <Link href="/dashboard/job-alerts" className="flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <div className="inline-flex items-center gap-2 mb-3 px-4 py-2 rounded-full bg-white/50 backdrop-blur border border-cyan-200/50">
            <Sparkles className="h-4 w-4 text-cyan-600 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-cyan-700">Smart Job Matching</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">
            Create <GradientText>Job Alert</GradientText>
          </h1>
          <p className="text-slate-600 text-lg">
            Set up a new alert to get notified about matching job opportunities
          </p>
        </div>
      </div>

      <Card className="border border-slate-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
          <CardTitle className="text-2xl">Alert Details</CardTitle>
          <CardDescription>
            Configure your job alert preferences to match your ideal role
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <form action={createJobAlertAction} className="space-y-8">
            {/* Keywords */}
            <div className="space-y-3">
              <Label htmlFor="keywords" className="text-base font-semibold text-slate-900">Keywords *</Label>
              <Textarea
                id="keywords"
                name="keywords"
                placeholder="Enter keywords separated by commas (e.g., React, JavaScript, Frontend)"
                rows={4}
                required
                className="rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20 transition-all resize-none"
              />
              <p className="text-sm text-slate-500 italic">
                💡 Enter job titles, skills, or keywords you're interested in. Our AI will match these across job postings.
              </p>
            </div>

            {/* Location */}
            <div className="space-y-3">
              <Label htmlFor="location" className="text-base font-semibold text-slate-900">Location (Optional)</Label>
              <Input
                id="location"
                name="location"
                placeholder="e.g., New York, Remote, San Francisco"
                className="rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20 transition-all"
              />
              <p className="text-sm text-slate-500 italic">
                🌍 Leave blank to get alerts from all locations worldwide
              </p>
            </div>

            {/* Job Type */}
            <div>
              <Label htmlFor="jobType">Job Type (Optional)</Label>
              <select
                id="jobType"
                name="jobType"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
            </div>

            {/* Frequency */}
            <div>
              <Label htmlFor="frequency">Notification Frequency</Label>
              <select
                id="frequency"
                name="frequency"
                defaultValue="daily"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="immediately">Immediately</option>
                <option value="daily">Daily Digest</option>
                <option value="weekly">Weekly Digest</option>
              </select>
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
