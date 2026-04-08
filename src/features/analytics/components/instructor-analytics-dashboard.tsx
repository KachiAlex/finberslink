"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Trophy,
  Clock,
  Target,
  BookOpen,
  Activity,
  Download,
  Mail
} from "lucide-react";

interface InstructorAnalyticsDashboardProps {
  courseId: string;
  data: {
    overview: {
      totalEnrollments: number;
      activeEnrollments: number;
      completedEnrollments: number;
      averageProgress: number;
      totalStudyTime: number;
      averageStudyTime: number;
      averageStreakDays: number;
      completionRate: number;
    };
    lessons: Array<{
      id: string;
      title: string;
      order: number;
      durationMinutes: number;
      format: string;
      totalStudents: number;
      completed: number;
      inProgress: number;
      notStarted: number;
      completionRate: number;
      averageScore: number;
      averageTimeSpent: number;
      difficulty: "Easy" | "Medium" | "Hard";
    }>;
    progressDistribution: Array<{
      range: string;
      count: number;
    }>;
    enrollmentTrends: Array<{
      date: string;
      enrollments: number;
    }>;
    atRiskStudents: Array<{
      user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
      enrollment: {
        progressPercentage: number;
        streakDays: number;
        lastAccessedAt: string | null;
        totalStudyTime: number;
      };
      riskFactors: {
        inactiveForDays: number | null;
        lowProgress: boolean;
        noStreak: boolean;
      };
    }>;
    topPerformers: Array<{
      user: {
        id: string;
        firstName: string;
        lastName: string;
      };
      progressPercentage: number;
      totalStudyTime: number;
      streakDays: number;
      averageScore: number;
    }>;
  };
}

export function InstructorAnalyticsDashboard({ courseId, data }: InstructorAnalyticsDashboardProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "text-green-600 bg-green-50";
      case "Medium": return "text-yellow-600 bg-yellow-50";
      case "Hard": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getRiskLevel = (student: any) => {
    let riskScore = 0;
    if (student.riskFactors.inactiveForDays && student.riskFactors.inactiveForDays > 7) riskScore += 3;
    if (student.riskFactors.lowProgress) riskScore += 2;
    if (student.riskFactors.noStreak) riskScore += 1;

    if (riskScore >= 4) return { level: "High", color: "text-red-600 bg-red-50" };
    if (riskScore >= 2) return { level: "Medium", color: "text-yellow-600 bg-yellow-50" };
    return { level: "Low", color: "text-green-600 bg-green-50" };
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalEnrollments}</div>
            <p className="text-xs text-muted-foreground">
              {data.overview.activeEnrollments} active this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.completionRate.toFixed(1)}%</div>
            <Progress value={data.overview.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.averageProgress}%</div>
            <p className="text-xs text-muted-foreground">
              Across all students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Study Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(data.overview.averageStudyTime)}</div>
            <p className="text-xs text-muted-foreground">Per student</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Progress Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.progressDistribution.map((segment) => (
                <div key={segment.range} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{segment.range}</span>
                    <span className="font-medium">{segment.count} students</span>
                  </div>
                  <Progress 
                    value={(segment.count / data.overview.totalEnrollments) * 100} 
                    className="h-2" 
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enrollment Trends (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.enrollmentTrends.slice(-7).map((trend) => (
                <div key={trend.date} className="flex justify-between text-sm">
                  <span>{formatDate(trend.date)}</span>
                  <span className="font-medium">{trend.enrollments} enrolled</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lesson Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Lesson Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Lesson</th>
                  <th className="text-center p-2">Format</th>
                  <th className="text-center p-2">Students</th>
                  <th className="text-center p-2">Completion</th>
                  <th className="text-center p-2">Avg Score</th>
                  <th className="text-center p-2">Avg Time</th>
                  <th className="text-center p-2">Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {data.lessons.map((lesson) => (
                  <tr key={lesson.id} className="border-b">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{lesson.title}</div>
                        <div className="text-xs text-gray-500">Lesson {lesson.order}</div>
                      </div>
                    </td>
                    <td className="text-center p-2">
                      <Badge variant="outline" className="text-xs">
                        {lesson.format}
                      </Badge>
                    </td>
                    <td className="text-center p-2">{lesson.totalStudents}</td>
                    <td className="text-center p-2">
                      <div className="flex flex-col items-center">
                        <span className="font-medium">{lesson.completionRate.toFixed(1)}%</span>
                        <Progress value={lesson.completionRate} className="h-1 w-16 mt-1" />
                      </div>
                    </td>
                    <td className="text-center p-2">
                      {lesson.averageScore > 0 ? `${lesson.averageScore}%` : "N/A"}
                    </td>
                    <td className="text-center p-2">{formatTime(lesson.averageTimeSpent)}</td>
                    <td className="text-center p-2">
                      <Badge className={`text-xs ${getDifficultyColor(lesson.difficulty)}`}>
                        {lesson.difficulty}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* At-Risk Students */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            At-Risk Students ({data.atRiskStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.atRiskStudents.length > 0 ? (
            <div className="space-y-4">
              {data.atRiskStudents.slice(0, 5).map((student) => {
                const risk = getRiskLevel(student);
                return (
                  <div key={student.user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-medium">
                          {student.user.firstName} {student.user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{student.user.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{student.enrollment.progressPercentage}%</div>
                        <div className="text-sm text-gray-500">Progress</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-medium">{student.enrollment.streakDays} days</div>
                        <div className="text-sm text-gray-500">Streak</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatTime(student.enrollment.totalStudyTime)}</div>
                        <div className="text-sm text-gray-500">Study time</div>
                      </div>
                      <Badge className={risk.color}>
                        {risk.level} Risk
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4 mr-1" />
                        Contact
                      </Button>
                    </div>
                  </div>
                );
              })}
              {data.atRiskStudents.length > 5 && (
                <div className="text-center">
                  <Button variant="outline">
                    View All {data.atRiskStudents.length} At-Risk Students
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <div className="text-sm font-medium">No at-risk students</div>
              <div className="text-xs">All students are progressing well!</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.topPerformers.slice(0, 6).map((student, index) => (
              <div key={student.user.id} className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">#{index + 1}</div>
                <div className="flex-1">
                  <div className="font-medium">
                    {student.user.firstName} {student.user.lastName}
                  </div>
                  <div className="text-sm text-gray-600">
                    {student.progressPercentage}% complete • {formatTime(student.totalStudyTime)}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {student.averageScore > 0 ? `${student.averageScore}% avg` : "No scores"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {student.streakDays} day streak
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Export & Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Analytics (CSV)
            </Button>
            <Button variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Email At-Risk Students
            </Button>
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Generate Class Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
