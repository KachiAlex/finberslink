"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Clock, 
  Activity, 
  BarChart3,
  Calendar,
  Filter,
  Download,
  Eye,
  AlertTriangle,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChatAnalytics {
  overview: {
    totalMessages: number;
    activeUsers: number;
    totalThreads: number;
    averageResponseTime: number;
    engagementRate: number;
    growthRate: number;
  };
  trends: {
    daily: Array<{
      date: string;
      messages: number;
      users: number;
      threads: number;
    }>;
    weekly: Array<{
      week: string;
      messages: number;
      users: number;
      threads: number;
    }>;
    hourly: Array<{
      hour: number;
      messages: number;
    }>;
  };
  userMetrics: {
    mostActive: Array<{
      userId: string;
      firstName: string;
      lastName: string;
      messageCount: number;
      threadCount: number;
      lastActive: string;
    }>;
    newest: Array<{
      userId: string;
      firstName: string;
      lastName: string;
      joinedAt: string;
      messageCount: number;
    }>;
    retention: {
      day1: number;
      day7: number;
      day30: number;
    };
  };
  contentMetrics: {
    topThreads: Array<{
      threadId: string;
      title: string;
      messageCount: number;
      participantCount: number;
      lastActivity: string;
    }>;
    topEmojis: Array<{
      emoji: string;
      count: number;
      percentage: number;
    }>;
    averageMessageLength: number;
    attachmentCount: number;
  };
  moderationMetrics: {
    reports: number;
    actions: number;
    resolved: number;
    pending: number;
    topIssues: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
  };
}

interface AnalyticsDashboardProps {
  currentUserId: string;
  userRole: 'admin' | 'moderator' | 'instructor' | 'student';
}

export function AnalyticsDashboard({ currentUserId, userRole }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<ChatAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock analytics data
        const mockAnalytics: ChatAnalytics = {
          overview: {
            totalMessages: 45230,
            activeUsers: 892,
            totalThreads: 1247,
            averageResponseTime: 4.5, // minutes
            engagementRate: 78.3, // percentage
            growthRate: 12.4 // percentage
          },
          trends: {
            daily: Array.from({ length: 30 }, (_, i) => ({
              date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              messages: Math.floor(Math.random() * 500) + 1000,
              users: Math.floor(Math.random() * 50) + 800,
              threads: Math.floor(Math.random() * 20) + 30
            })),
            weekly: Array.from({ length: 12 }, (_, i) => ({
              week: `Week ${i + 1}`,
              messages: Math.floor(Math.random() * 3000) + 7000,
              users: Math.floor(Math.random() * 200) + 700,
              threads: Math.floor(Math.random() * 100) + 200
            })),
            hourly: Array.from({ length: 24 }, (_, i) => ({
              hour: i,
              messages: Math.floor(Math.random() * 200) + (i >= 9 && i <= 17 ? 300 : 50)
            }))
          },
          userMetrics: {
            mostActive: Array.from({ length: 10 }, (_, i) => ({
              userId: `user${i}`,
              firstName: `User${i}`,
              lastName: `Name${i}`,
              messageCount: Math.floor(Math.random() * 500) + 100,
              threadCount: Math.floor(Math.random() * 20) + 5,
              lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
            })),
            newest: Array.from({ length: 10 }, (_, i) => ({
              userId: `newuser${i}`,
              firstName: `New${i}`,
              lastName: `User${i}`,
              joinedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
              messageCount: Math.floor(Math.random() * 50)
            })),
            retention: {
              day1: 85.2,
              day7: 67.8,
              day30: 43.5
            }
          },
          contentMetrics: {
            topThreads: Array.from({ length: 10 }, (_, i) => ({
              threadId: `thread${i}`,
              title: `Discussion Thread ${i + 1}`,
              messageCount: Math.floor(Math.random() * 200) + 50,
              participantCount: Math.floor(Math.random() * 30) + 10,
              lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
            })),
            topEmojis: [
              { emoji: 'thumbsup', count: 1234, percentage: 35.2 },
              { emoji: 'heart', count: 876, percentage: 25.1 },
              { emoji: 'laugh', count: 654, percentage: 18.7 },
              { emoji: 'wow', count: 432, percentage: 12.4 },
              { emoji: 'sad', count: 298, percentage: 8.6 }
            ],
            averageMessageLength: 47.3,
            attachmentCount: 892
          },
          moderationMetrics: {
            reports: 23,
            actions: 18,
            resolved: 15,
            pending: 8,
            topIssues: [
              { type: 'spam', count: 12, percentage: 52.2 },
              { type: 'harassment', count: 6, percentage: 26.1 },
              { type: 'inappropriate', count: 3, percentage: 13.0 },
              { type: 'off-topic', count: 2, percentage: 8.7 }
            ]
          }
        };

        setAnalytics(mockAnalytics);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [dateRange]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getTrendIcon = (value: number) => {
    return value >= 0 ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics unavailable</h3>
        <p className="text-gray-500">
          Unable to load analytics data at this time
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Chat Analytics</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Messages</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.overview.totalMessages)}</p>
                <div className="flex items-center space-x-1 text-xs">
                  {getTrendIcon(analytics.overview.growthRate)}
                  <span className={analytics.overview.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {analytics.overview.growthRate}%
                  </span>
                </div>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.overview.activeUsers)}</p>
                <div className="flex items-center space-x-1 text-xs">
                  <Users className="w-3 h-3 text-green-500" />
                  <span className="text-green-600">Online</span>
                </div>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Threads</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.overview.totalThreads)}</p>
                <div className="flex items-center space-x-1 text-xs">
                  <Activity className="w-3 h-3 text-blue-500" />
                  <span className="text-blue-600">Active</span>
                </div>
              </div>
              <MessageSquare className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Response</p>
                <p className="text-2xl font-bold">{analytics.overview.averageResponseTime}m</p>
                <div className="flex items-center space-x-1 text-xs">
                  <Clock className="w-3 h-3 text-orange-500" />
                  <span className="text-orange-600">Fast</span>
                </div>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Engagement</p>
                <p className="text-2xl font-bold">{analytics.overview.engagementRate}%</p>
                <div className="flex items-center space-x-1 text-xs">
                  <Award className="w-3 h-3 text-purple-500" />
                  <span className="text-purple-600">High</span>
                </div>
              </div>
              <Award className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reports</p>
                <p className="text-2xl font-bold">{analytics.moderationMetrics.reports}</p>
                <div className="flex items-center space-x-1 text-xs">
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                  <span className="text-red-600">Low</span>
                </div>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.trends.daily.slice(-7).map((day, index) => (
                    <div key={day.date} className="flex items-center justify-between">
                      <span className="text-sm">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(day.messages / 1500) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{day.messages}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hourly Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.trends.hourly.map((hour, index) => (
                    <div key={hour.hour} className="flex items-center justify-between">
                      <span className="text-sm w-8">{hour.hour}:00</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(hour.messages / 500) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{hour.messages}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Most Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.userMetrics.mostActive.slice(0, 5).map((user, index) => (
                    <div key={user.userId} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                          {user.firstName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {user.messageCount} messages, {user.threadCount} threads
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Retention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Day 1</span>
                      <span>{analytics.userMetrics.retention.day1}%</span>
                    </div>
                    <Progress value={analytics.userMetrics.retention.day1} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Day 7</span>
                      <span>{analytics.userMetrics.retention.day7}%</span>
                    </div>
                    <Progress value={analytics.userMetrics.retention.day7} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Day 30</span>
                      <span>{analytics.userMetrics.retention.day30}%</span>
                    </div>
                    <Progress value={analytics.userMetrics.retention.day30} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Threads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.contentMetrics.topThreads.slice(0, 5).map((thread, index) => (
                    <div key={thread.threadId} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm truncate max-w-xs">
                          {thread.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {thread.messageCount} messages, {thread.participantCount} participants
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popular Emojis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.contentMetrics.topEmojis.map((emoji, index) => (
                    <div key={emoji.emoji} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{emoji.emoji === 'thumbsup' ? 'thumbsup' : emoji.emoji}</span>
                        <span className="text-sm capitalize">{emoji.emoji}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-500 h-2 rounded-full" 
                            style={{ width: `${emoji.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{emoji.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.trends.weekly.slice(-4).map((week, index) => (
                  <div key={week.week} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{week.week}</span>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="w-3 h-3 text-blue-500" />
                        <span>{week.messages}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3 text-green-500" />
                        <span>{week.users}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="w-3 h-3 text-purple-500" />
                        <span>{week.threads}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Moderation Tab */}
        <TabsContent value="moderation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Moderation Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Reports</span>
                    <Badge variant="outline">{analytics.moderationMetrics.reports}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Actions Taken</span>
                    <Badge variant="outline">{analytics.moderationMetrics.actions}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Resolved</span>
                    <Badge className="bg-green-100 text-green-800">{analytics.moderationMetrics.resolved}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Pending</span>
                    <Badge className="bg-yellow-100 text-yellow-800">{analytics.moderationMetrics.pending}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.moderationMetrics.topIssues.map((issue, index) => (
                    <div key={issue.type} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{issue.type}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full" 
                            style={{ width: `${issue.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{issue.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
