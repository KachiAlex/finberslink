"use client";

import { useState, useEffect } from "react";
import { 
  Bell, 
  Check, 
  X, 
  Briefcase, 
  Star, 
  Calendar, 
  Search,
  Filter,
  Trash2,
  Settings,
  Mail,
  Smartphone,
  Eye,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { 
  JobNotification, 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification,
  getUnreadNotificationCount,
  getUserNotificationPreferences,
  updateUserNotificationPreferences
} from "@/features/jobs/notifications";

interface JobNotificationsTabProps {
  userId: string;
}

export function JobNotificationsTab({ userId }: JobNotificationsTabProps) {
  const [notifications, setNotifications] = useState<JobNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [preferences, setPreferences] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("notifications");

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [notificationsData, unreadData, preferencesData] = await Promise.all([
        getUserNotifications(userId, 50),
        getUnreadNotificationCount(userId),
        getUserNotificationPreferences(userId)
      ]);
      
      setNotifications(notificationsData);
      setUnreadCount(unreadData);
      setPreferences(preferencesData);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleUpdatePreferences = async (key: string, value: boolean) => {
    try {
      await updateUserNotificationPreferences(userId, { [key]: value });
      setPreferences(prev => prev ? { ...prev, [key]: value } : null);
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPLICATION_STATUS': return <Briefcase className="w-4 h-4" />;
      case 'NEW_MATCHING_JOB': return <Star className="w-4 h-4" />;
      case 'JOB_ALERT': return <Search className="w-4 h-4" />;
      case 'APPLICATION_REVIEW': return <Eye className="w-4 h-4" />;
      case 'INTERVIEW_SCHEDULED': return <Calendar className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'APPLICATION_STATUS': return 'bg-blue-100 text-blue-800';
      case 'NEW_MATCHING_JOB': return 'bg-green-100 text-green-800';
      case 'JOB_ALERT': return 'bg-purple-100 text-purple-800';
      case 'APPLICATION_REVIEW': return 'bg-orange-100 text-orange-800';
      case 'INTERVIEW_SCHEDULED': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = searchQuery === "" || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === "all" || notification.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
          <p className="text-sm text-slate-600">
            Stay updated on your job applications and new opportunities
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="secondary">
              {unreadCount} unread
            </Badge>
          )}
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="APPLICATION_STATUS">Application Status</SelectItem>
                <SelectItem value="NEW_MATCHING_JOB">New Matches</SelectItem>
                <SelectItem value="JOB_ALERT">Job Alerts</SelectItem>
                <SelectItem value="APPLICATION_REVIEW">Application Review</SelectItem>
                <SelectItem value="INTERVIEW_SCHEDULED">Interviews</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <Card className="border-slate-200 bg-slate-50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="w-16 h-16 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No Notifications</h3>
                <p className="text-slate-600 text-center">
                  {searchQuery || typeFilter !== "all" 
                    ? "No notifications match your filters"
                    : "You're all caught up! No new notifications."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`border-slate-200 ${!notification.isRead ? 'bg-blue-50 border-blue-200' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className={`font-medium ${!notification.isRead ? 'text-blue-900' : 'text-slate-900'}`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-1">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteNotification(notification.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <p className={`text-sm mb-2 ${!notification.isRead ? 'text-blue-800' : 'text-slate-600'}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {preferences && (
                <>
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Delivery Methods</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-notifications" className="text-base">Email Notifications</Label>
                        <p className="text-sm text-slate-500">Receive notifications via email</p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={preferences.emailNotifications}
                        onCheckedChange={(checked) => handleUpdatePreferences('emailNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="push-notifications" className="text-base">Push Notifications</Label>
                        <p className="text-sm text-slate-500">Receive browser push notifications</p>
                      </div>
                      <Switch
                        id="push-notifications"
                        checked={preferences.pushNotifications}
                        onCheckedChange={(checked) => handleUpdatePreferences('pushNotifications', checked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Notification Types</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="application-updates" className="text-base flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          Application Updates
                        </Label>
                        <p className="text-sm text-slate-500">Status changes, interview requests, offers</p>
                      </div>
                      <Switch
                        id="application-updates"
                        checked={preferences.applicationUpdates}
                        onCheckedChange={(checked) => handleUpdatePreferences('applicationUpdates', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="new-job-matches" className="text-base flex items-center gap-2">
                          <Star className="w-4 h-4" />
                          New Job Matches
                        </Label>
                        <p className="text-sm text-slate-500">Personalized job recommendations</p>
                      </div>
                      <Switch
                        id="new-job-matches"
                        checked={preferences.newJobMatches}
                        onCheckedChange={(checked) => handleUpdatePreferences('newJobMatches', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="job-alerts" className="text-base flex items-center gap-2">
                          <Search className="w-4 h-4" />
                          Job Alerts
                        </Label>
                        <p className="text-sm text-slate-500">New jobs matching your saved searches</p>
                      </div>
                      <Switch
                        id="job-alerts"
                        checked={preferences.jobAlerts}
                        onCheckedChange={(checked) => handleUpdatePreferences('jobAlerts', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="marketing-emails" className="text-base flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Marketing Emails
                        </Label>
                        <p className="text-sm text-slate-500">Tips, career advice, and platform updates</p>
                      </div>
                      <Switch
                        id="marketing-emails"
                        checked={preferences.marketingEmails}
                        onCheckedChange={(checked) => handleUpdatePreferences('marketingEmails', checked)}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
