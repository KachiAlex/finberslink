import { Bell, Plus, Trash2, Edit2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function JobAlertsPage() {
  // TODO: Fetch user's job alerts once migration is complete
  const alerts: any[] = [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Job Alerts</h1>
        <p className="text-gray-600 mt-2">
          Get notified when new jobs matching your criteria are posted
        </p>
      </div>

      {/* Create Alert Button */}
      <div>
        <Button asChild>
          <Link href="/dashboard/job-alerts/create" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create New Alert
          </Link>
        </Button>
      </div>

      {/* Alerts List */}
      {alerts.length > 0 ? (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bell className="w-5 h-5 text-blue-600" />
                      {alert.keywords.join(", ")}
                    </CardTitle>
                    <CardDescription>
                      {alert.location && `Location: ${alert.location} • `}
                      {alert.jobType && `Type: ${alert.jobType}`}
                    </CardDescription>
                  </div>
                  <Badge variant={alert.isActive ? "default" : "secondary"}>
                    {alert.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/job-alerts/${alert.id}/edit`} className="flex items-center gap-1">
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Job Alerts</h3>
            <p className="text-gray-600 mb-4">
              Create your first job alert to get notified about new opportunities
            </p>
            <Button asChild>
              <Link href="/dashboard/job-alerts/create">
                Create Alert
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Job Alerts Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-600 text-white">
                1
              </div>
            </div>
            <div>
              <h4 className="font-semibold">Create an Alert</h4>
              <p className="text-sm text-gray-600">
                Set your preferences including keywords, location, and job type
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-600 text-white">
                2
              </div>
            </div>
            <div>
              <h4 className="font-semibold">Get Notifications</h4>
              <p className="text-sm text-gray-600">
                Receive email notifications when new jobs match your criteria
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-600 text-white">
                3
              </div>
            </div>
            <div>
              <h4 className="font-semibold">Apply Quickly</h4>
              <p className="text-sm text-gray-600">
                Click through to view jobs and apply directly from the notification
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
