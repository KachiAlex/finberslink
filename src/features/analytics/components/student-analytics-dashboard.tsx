"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Flame, 
  Clock, 
  Target, 
  TrendingUp, 
  Award,
  BookOpen,
  Users,
  Calendar,
  Activity
} from "lucide-react";
import { CourseProgressCard, StreakTracker } from "@/features/progress/components/progress-components";
import { useCourseProgress } from "@/features/progress/hooks/use-progress-tracking";
import { getStudentAnalytics } from "../service";

interface StudentAnalyticsDashboardProps {
  userId: string;
  initialData?: {
    totalCourses: number;
    completedCourses: number;
    totalStudyTime: number;
    averageProgress: number;
    longestStreak: number;
    recentAchievements: Array<{
      name: string;
      description: string;
      icon: string;
      category: string;
      unlockedAt: string;
    }>;
  };
}

export function StudentAnalyticsDashboard({ 
  userId, 
  initialData 
}: StudentAnalyticsDashboardProps) {
  const [selectedCourse, setSelectedCourse] = React.useState<string | null>(null);
  
  const { courseProgress } = useCourseProgress(selectedCourse || "");

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStreakEmoji = (days: number) => {
    if (days >= 30) return "🔥🔥🔥";
    if (days >= 14) return "🔥🔥";
    if (days >= 7) return "🔥";
    if (days >= 3) return "💫";
    return "✨";
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialData?.totalCourses || 0}</div>
            <p className="text-xs text-muted-foreground">
              {initialData?.completedCourses || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(initialData?.totalStudyTime || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total time spent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialData?.averageProgress || 0}%</div>
            <Progress value={initialData?.averageProgress || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Longest Streak</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{initialData?.longestStreak || 0}</span>
              <span className="text-lg">{getStreakEmoji(initialData?.longestStreak || 0)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Days in a row</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Recent Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {initialData?.recentAchievements && initialData.recentAchievements.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {initialData.recentAchievements.slice(0, 6).map((achievement, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200"
                >
                  <div className="text-3xl">{achievement.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {achievement.name}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {achievement.description}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {achievement.category}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Award className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <div className="text-sm font-medium">No achievements yet</div>
              <div className="text-xs">Complete lessons to unlock achievements!</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learning Insights */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Learning Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">This Week</span>
              <span className="font-medium">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Best Day</span>
              <span className="font-medium">Monday</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Preferred Time</span>
              <span className="font-medium">Evening</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg Session</span>
              <span className="font-medium">45 min</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progress Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Weekly Growth</span>
                <span className="text-green-600 font-medium">+12%</span>
              </div>
              <Progress value={12} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completion Rate</span>
                <span className="text-blue-600 font-medium">78%</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Engagement Score</span>
                <span className="text-purple-600 font-medium">85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Learning Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Mon</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tue</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Wed</span>
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Thu</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Fri</span>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Sat</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Sun</span>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Progress Details */}
      {selectedCourse && courseProgress && (
        <CourseProgressCard
          progress={courseProgress.progress}
          achievements={courseProgress.achievements}
        />
      )}

      {/* Motivational Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="text-2xl font-bold text-blue-900">
              Keep up the great work! 🎉
            </div>
            <div className="text-blue-700">
              You're making excellent progress. Consistency is key to mastering new skills.
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-blue-600">
              <div className="flex items-center gap-1">
                <Flame className="h-4 w-4" />
                <span>Stay consistent</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>Set daily goals</span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4" />
                <span>Celebrate wins</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
