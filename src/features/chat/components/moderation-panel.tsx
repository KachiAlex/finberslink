"use client";

import { useState, useEffect } from "react";
import { 
  Shield, 
  AlertTriangle, 
  Ban, 
  MessageSquare, 
  Users, 
  Clock, 
  Search,
  Filter,
  Eye,
  EyeOff,
  Trash2,
  Archive,
  Flag,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Textarea } from "../../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Avatar } from "../../components/ui/avatar";

interface ModerationAction {
  id: string;
  type: 'warning' | 'timeout' | 'ban' | 'delete_message' | 'archive_thread';
  targetUserId?: string;
  targetMessageId?: string;
  targetThreadId?: string;
  reason: string;
  moderatorId: string;
  createdAt: string;
  status: 'pending' | 'active' | 'expired';
}

interface ReportedContent {
  id: string;
  type: 'message' | 'thread' | 'user';
  reporterId: string;
  reportedUserId?: string;
  messageId?: string;
  threadId?: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

interface ChatAnalytics {
  totalMessages: number;
  activeUsers: number;
  reportedContent: number;
  moderationActions: number;
  topReportedUsers: Array<{
    userId: string;
    firstName: string;
    lastName: string;
    reportCount: number;
  }>;
  messageTrends: Array<{
    date: string;
    count: number;
  }>;
}

export function ModerationPanel({ currentUserId }: { currentUserId: string }) {
  const [activeTab, setActiveTab] = useState('reports');
  const [reportedContent, setReportedContent] = useState<ReportedContent[]>([]);
  const [moderationActions, setModerationActions] = useState<ModerationAction[]>([]);
  const [analytics, setAnalytics] = useState<ChatAnalytics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data fetching
  useEffect(() => {
    const fetchModerationData = async () => {
      setIsLoading(true);
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock reported content
        const mockReports: ReportedContent[] = [
          {
            id: '1',
            type: 'message',
            reporterId: 'user1',
            reportedUserId: 'user2',
            messageId: 'msg1',
            reason: 'inappropriate_content',
            description: 'Message contains harassing language',
            status: 'pending',
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
          },
          {
            id: '2',
            type: 'thread',
            reporterId: 'user3',
            reportedUserId: 'user4',
            threadId: 'thread1',
            reason: 'spam',
            description: 'User posting spam content repeatedly',
            status: 'pending',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
          },
          {
            id: '3',
            type: 'user',
            reporterId: 'user5',
            reportedUserId: 'user6',
            reason: 'harassment',
            description: 'User sending harassing messages to multiple users',
            status: 'reviewed',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
            reviewedBy: currentUserId,
            reviewedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
          }
        ];

        // Mock moderation actions
        const mockActions: ModerationAction[] = [
          {
            id: '1',
            type: 'warning',
            targetUserId: 'user2',
            reason: 'Inappropriate language in chat',
            moderatorId: currentUserId,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
            status: 'active'
          },
          {
            id: '2',
            type: 'delete_message',
            targetMessageId: 'msg1',
            reason: 'Harassment policy violation',
            moderatorId: currentUserId,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
            status: 'active'
          }
        ];

        // Mock analytics
        const mockAnalytics: ChatAnalytics = {
          totalMessages: 15420,
          activeUsers: 234,
          reportedContent: 8,
          moderationActions: 12,
          topReportedUsers: [
            { userId: 'user2', firstName: 'John', lastName: 'Doe', reportCount: 3 },
            { userId: 'user4', firstName: 'Jane', lastName: 'Smith', reportCount: 2 },
            { userId: 'user6', firstName: 'Bob', lastName: 'Wilson', reportCount: 1 }
          ],
          messageTrends: [
            { date: '2024-01-01', count: 120 },
            { date: '2024-01-02', count: 145 },
            { date: '2024-01-03', count: 132 },
            { date: '2024-01-04', count: 167 },
            { date: '2024-01-05', count: 189 }
          ]
        };

        setReportedContent(mockReports);
        setModerationActions(mockActions);
        setAnalytics(mockAnalytics);
      } catch (error) {
        console.error('Failed to fetch moderation data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModerationData();
  }, [currentUserId]);

  const handleReportAction = async (reportId: string, action: 'approve' | 'dismiss') => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setReportedContent(prev => 
        prev.map(report => 
          report.id === reportId 
            ? { 
                ...report, 
                status: action === 'approve' ? 'resolved' : 'dismissed',
                reviewedBy: currentUserId,
                reviewedAt: new Date().toISOString()
              }
            : report
        )
      );
    } catch (error) {
      console.error('Failed to handle report action:', error);
    }
  };

  const handleModerationAction = async (action: {
    type: 'warning' | 'timeout' | 'ban' | 'delete_message' | 'archive_thread';
    targetUserId?: string;
    targetMessageId?: string;
    targetThreadId?: string;
    reason: string;
  }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newAction: ModerationAction = {
        id: `action_${Date.now()}`,
        ...action,
        moderatorId: currentUserId,
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      setModerationActions(prev => [newAction, ...prev]);
    } catch (error) {
      console.error('Failed to execute moderation action:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-red-100 text-red-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-4 h-4" />;
      case 'thread': return <Users className="w-4 h-4" />;
      case 'user': return <Shield className="w-4 h-4" />;
      default: return <Flag className="w-4 h-4" />;
    }
  };

  const filteredReports = reportedContent.filter(report => {
    const matchesSearch = !searchQuery || 
      report.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
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
        <div className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Chat Moderation</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-red-600">
            {reportedContent.filter(r => r.status === 'pending').length} Pending
          </Badge>
          <Badge variant="outline" className="text-green-600">
            {analytics?.activeUsers} Active Users
          </Badge>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Messages</p>
                  <p className="text-2xl font-bold">{analytics.totalMessages.toLocaleString()}</p>
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
                  <p className="text-2xl font-bold">{analytics.activeUsers}</p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Reports</p>
                  <p className="text-2xl font-bold">{analytics.reportedContent}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Actions Taken</p>
                  <p className="text-2xl font-bold">{analytics.moderationActions}</p>
                </div>
                <Shield className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">Problem Users</TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-96">
            <div className="space-y-3">
              {filteredReports.map((report) => (
                <Card key={report.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getTypeIcon(report.type)}
                          <span className="font-medium capitalize">{report.type} Report</span>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Reason:</strong> {report.reason.replace('_', ' ')}
                        </p>
                        
                        <p className="text-sm text-gray-700 mb-2">
                          {report.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Reported {new Date(report.createdAt).toLocaleString()}</span>
                          {report.reviewedBy && (
                            <span>Reviewed by {report.reviewedBy}</span>
                          )}
                        </div>
                      </div>
                      
                      {report.status === 'pending' && (
                        <div className="flex space-x-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReportAction(report.id, 'dismiss')}
                            className="text-green-600"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Dismiss
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReportAction(report.id, 'approve')}
                            className="text-red-600"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Take Action
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {moderationActions.map((action) => (
                <Card key={action.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getStatusColor(action.status)}>
                            {action.type.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(action.createdAt).toLocaleString()}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-700">{action.reason}</p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Archive className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Message Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics?.messageTrends.map((trend, index) => (
                    <div key={trend.date} className="flex items-center justify-between">
                      <span className="text-sm">{trend.date}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(trend.count / 200) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{trend.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Reported Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.topReportedUsers.map((user, index) => (
                    <div key={user.userId} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-6 h-6">
                          <div className="w-full h-full bg-red-100 rounded-full flex items-center justify-center text-xs">
                            {user.firstName[0]}
                          </div>
                        </Avatar>
                        <span className="text-sm">
                          {user.firstName} {user.lastName}
                        </span>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        {user.reportCount} reports
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Problem Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Problem Users Analysis</h3>
            <p className="text-gray-500">
              Advanced user behavior analysis and pattern detection coming soon
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
