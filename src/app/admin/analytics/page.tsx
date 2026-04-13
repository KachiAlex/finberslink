import { BarChart3, TrendingUp, Users, BookOpen, Briefcase, Activity } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnalyticsOverview } from "@/features/admin/service";

import { AdminShell } from "../_components/admin-shell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminAnalyticsPage() {
  const analytics = await getAnalyticsOverview();

  const statCards = [
    {
      title: "Total Users",
      value: analytics.overview.totalUsers,
      icon: Users,
      change: analytics.metrics.recentEnrollments,
      changeLabel: "new enrollments (30d)",
      color: "bg-blue-600/10 text-blue-700",
    },
    {
      title: "Active Students",
      value: analytics.overview.totalStudents,
      icon: BookOpen,
      change: analytics.metrics.completionRate,
      changeLabel: "completion rate",
      color: "bg-green-600/10 text-green-700",
    },
    {
      title: "Job Opportunities",
      value: analytics.overview.totalJobs,
      icon: Briefcase,
      change: analytics.metrics.placementRate,
      changeLabel: "placement rate",
      color: "bg-purple-600/10 text-purple-700",
    },
    {
      title: "Forum Activity",
      value: analytics.overview.totalForumThreads,
      icon: Activity,
      change: analytics.overview.totalForumPosts,
      changeLabel: "total posts",
      color: "bg-orange-600/10 text-orange-700",
    },
  ];

  return (
    <div className="space-y-6">
      <AdminShell
        title="Analytics Dashboard"
        description="Platform performance metrics and insights."
      >
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>{stat.change}</span>
                  <span>{stat.changeLabel}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Platform Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Platform Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Courses</span>
                  <Badge variant="outline">{analytics.overview.totalCourses}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Enrollments</span>
                  <Badge variant="outline">{analytics.overview.totalEnrollments}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Applications</span>
                  <Badge variant="outline">{analytics.overview.totalApplications}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Resumes</span>
                  <Badge variant="outline">{analytics.overview.totalResumes}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Tutors</span>
                  <Badge variant="outline">{analytics.overview.totalTutors}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Admins</span>
                  <Badge variant="outline">{analytics.overview.totalAdmins}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Courses */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topCourses && analytics.topCourses.length > 0 ? (
                  analytics.topCourses.map((course, index) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {course.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {course.category}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">
                          {course._count?.enrollments ?? 0}
                        </div>
                        <div className="text-xs text-gray-500">
                          enrollments
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    No course data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Completion and Placement Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Completion Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.courseCompletionStats && analytics.courseCompletionStats.length > 0 ? (
                  analytics.courseCompletionStats.map((stat) => {
                    const completionTotal = analytics.overview.totalEnrollments || 1;
                    const completionPercent = Math.min(
                      100,
                      Math.round(((stat._count?.status ?? 0) / completionTotal) * 100) || 0,
                    );

                    return (
                      <div
                        key={stat.status}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm font-medium capitalize">
                          {stat.status.toLowerCase()}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${completionPercent}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {stat._count?.status ?? 0}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    No completion data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Application Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.jobPlacementStats && analytics.jobPlacementStats.length > 0 ? (
                  analytics.jobPlacementStats.map((stat) => {
                    const applicationTotal = analytics.overview.totalApplications || 1;
                    const placementPercent = Math.min(
                      100,
                      Math.round(((stat._count?.status ?? 0) / applicationTotal) * 100) || 0,
                    );

                    return (
                      <div
                        key={stat.status}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm font-medium capitalize">
                          {stat.status.toLowerCase()}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${placementPercent}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {stat._count?.status ?? 0}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    No placement data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent User Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.recentUsers && analytics.recentUsers.length > 0 ? (
                analytics.recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {user.role.replace("_", " ")}
                      </Badge>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  No recent user activity
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </AdminShell>
    </div>
  );
}
