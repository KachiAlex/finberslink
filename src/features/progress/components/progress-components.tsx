import React from "react";
import { Progress } from "../../../components/ui/progress";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Trophy, Flame, Clock, Target, TrendingUp, Award } from "lucide-react";

interface CourseProgressCardProps {
  progress: {
    completedLessons: number;
    inProgressLessons: number;
    notStartedLessons: number;
    progressPercentage: number;
    totalStudyTime: number;
    averageTimePerLesson: number;
    streakDays: number;
    progressVelocity: number;
    estimatedWeeksToComplete: number | null;
  };
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    points: number;
    unlockedAt: string;
  }>;
}

export function CourseProgressCard({ progress, achievements }: CourseProgressCardProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 50) return "bg-blue-500";
    if (percentage >= 25) return "bg-yellow-500";
    return "bg-gray-500";
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Main Progress */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Course Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Overall Completion</span>
              <span className="font-bold text-lg">{progress.progressPercentage}%</span>
            </div>
            <Progress 
              value={progress.progressPercentage} 
              className="h-3"
            />
          </div>

          {/* Lesson Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {progress.completedLessons}
              </div>
              <div className="text-xs text-green-700">Completed</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {progress.inProgressLessons}
              </div>
              <div className="text-xs text-blue-700">In Progress</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {progress.notStartedLessons}
              </div>
              <div className="text-xs text-gray-700">Not Started</div>
            </div>
          </div>

          {/* Time & Velocity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Clock className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-sm font-medium text-purple-900">
                  Total Study Time
                </div>
                <div className="text-lg font-bold text-purple-600">
                  {formatTime(progress.totalStudyTime)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-sm font-medium text-orange-900">
                  Learning Pace
                </div>
                <div className="text-lg font-bold text-orange-600">
                  {progress.progressVelocity.toFixed(1)} lessons/week
                </div>
              </div>
            </div>
          </div>

          {/* Streak & Estimation */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Flame className="h-6 w-6 text-orange-600" />
              <div>
                <div className="text-sm font-medium text-orange-900">
                  Current Streak
                </div>
                <div className="text-xl font-bold text-orange-600">
                  {progress.streakDays} days
                </div>
              </div>
            </div>
            {progress.estimatedWeeksToComplete && (
              <div className="text-right">
                <div className="text-sm font-medium text-orange-900">
                  Est. Completion
                </div>
                <div className="text-lg font-bold text-orange-600">
                  {progress.estimatedWeeksToComplete} weeks
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Recent Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {achievements.length > 0 ? (
            <div className="space-y-3">
              {achievements.slice(0, 5).map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-start gap-3 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg"
                >
                  <div className="text-2xl">{achievement.icon}</div>
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
                        +{achievement.points} pts
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
    </div>
  );
}

interface LessonProgressIndicatorProps {
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  progress: number;
  timeSpent: number;
  score?: number | null;
}

export function LessonProgressIndicator({
  status,
  progress,
  timeSpent,
  score,
}: LessonProgressIndicatorProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-500";
      case "IN_PROGRESS":
        return "bg-blue-500";
      default:
        return "bg-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "✓";
      case "IN_PROGRESS":
        return "▶";
      default:
        return "○";
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getStatusColor(
          status
        )}`}
      >
        {getStatusIcon(status)}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="font-medium capitalize">
            {status.replace("_", " ").toLowerCase()}
          </span>
          <span className="text-gray-500">{Math.round(progress * 100)}%</span>
        </div>
        <Progress value={progress * 100} className="h-1" />
        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
          <span>{Math.floor(timeSpent / 60)}h {timeSpent % 60}m</span>
          {score !== null && (
            <span className="font-medium">Score: {score}%</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface StreakTrackerProps {
  streakDays: number;
  lastStreakDate?: string | null;
}

export function StreakTracker({ streakDays, lastStreakDate }: StreakTrackerProps) {
  const getStreakMessage = (days: number) => {
    if (days === 0) return "Start your learning streak!";
    if (days === 1) return "Great start! Keep it going!";
    if (days <= 7) return `${days} day streak! You're on fire! 🔥`;
    if (days <= 30) return `${days} days! Amazing consistency!`;
    return `${days} days! You're a learning legend! 🏆`;
  };

  const getStreakColor = (days: number) => {
    if (days === 0) return "text-gray-500";
    if (days <= 3) return "text-orange-500";
    if (days <= 7) return "text-red-500";
    if (days <= 14) return "text-purple-500";
    return "text-yellow-500";
  };

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6" />
            <span className="text-2xl font-bold">{streakDays}</span>
            <span className="text-sm">day streak</span>
          </div>
          <div className="text-sm mt-1 opacity-90">
            {getStreakMessage(streakDays)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs opacity-75">Last active</div>
          <div className="text-sm font-medium">
            {lastStreakDate
              ? new Date(lastStreakDate).toLocaleDateString()
              : "Never"}
          </div>
        </div>
      </div>
    </div>
  );
}
