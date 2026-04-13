'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, Eye, FileDown, Share2, RefreshCw } from 'lucide-react';

interface AnalyticsSummary {
  totalViews: number;
  totalDownloads: number;
  totalShares: number;
  totalExports: number;
  uniqueViewers: number;
  viewToDownloadRatio: number;
  shareToViewRatio: number;
}

interface ViewRecord {
  id: string;
  timestamp: string;
  deviceType?: string;
  browser?: string;
  operatingSystem?: string;
  country?: string;
  city?: string;
  timeSpentSeconds?: number;
  viewerEmail?: string;
}

interface ViewerInfo {
  viewerEmail?: string;
  viewerName?: string;
  lastViewedAt: string;
  viewCount: number;
  deviceType?: string;
  country?: string;
}

interface AnalyticsDashboardData {
  summary: AnalyticsSummary;
  trends: {
    views: Array<{ date: string; value: number; change: number }>;
    downloads: Array<{ date: string; value: number; change: number }>;
    shares: Array<{ date: string; value: number; change: number }>;
    exports: Array<{ date: string; value: number; change: number }>;
  };
  sectionEngagement: Array<{
    sectionName: string;
    viewCount: number;
    timeSpentSeconds: number;
    scrollDepth: number;
    engagementPercentage: number;
    rank: number;
  }>;
  viewHistory: ViewRecord[];
  recentViewers: ViewerInfo[];
}

interface AnalyticsDashboardProps {
  resumeId: string;
  resumeTitle?: string;
}

export function AnalyticsDashboard({ resumeId, resumeTitle = 'Resume' }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Calculate date range
      let startDate: Date | null = null;
      const endDate = new Date();

      if (dateRange === '7d') {
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateRange === '30d') {
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (dateRange === '90d') {
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
      }

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      params.append('endDate', endDate.toISOString());
      params.append('groupBy', 'day');

      const response = await fetch(`/api/resume/analytics/${resumeId}?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analytics');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [resumeId, dateRange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-900">Error Loading Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-800">{error || 'Failed to load analytics data'}</p>
          <Button onClick={fetchAnalytics} className="mt-4" variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { summary, viewHistory, recentViewers, sectionEngagement } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-sm text-gray-600 mt-1">{resumeTitle}</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <Button onClick={fetchAnalytics} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalViews}</div>
            <p className="text-xs text-gray-500 mt-1">{summary.uniqueViewers} unique viewers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <FileDown className="h-4 w-4" />
              Downloads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalDownloads}</div>
            <p className="text-xs text-gray-500 mt-1">
              {(summary.viewToDownloadRatio * 100).toFixed(1)}% conversion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Shares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalShares}</div>
            <p className="text-xs text-gray-500 mt-1">
              {(summary.shareToViewRatio * 100).toFixed(1)}% share rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalExports}</div>
            <p className="text-xs text-gray-500 mt-1">PDF exports</p>
          </CardContent>
        </Card>
      </div>

      {/* Section Engagement */}
      {sectionEngagement.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Section Engagement</CardTitle>
            <CardDescription>Most viewed sections of your resume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sectionEngagement.slice(0, 5).map((section) => (
                <div key={section.sectionName} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{section.sectionName}</span>
                    <span className="text-xs text-gray-500">
                      {section.viewCount} views • {Math.round(section.engagementPercentage)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${section.engagementPercentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* View History */}
      <Card>
        <CardHeader>
          <CardTitle>View History</CardTitle>
          <CardDescription>Recent views of your resume</CardDescription>
        </CardHeader>
        <CardContent>
          {viewHistory.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {viewHistory.map((view) => (
                <div key={view.id} className="flex items-start justify-between py-2 border-b last:border-b-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {view.viewerEmail || 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(view.timestamp).toLocaleDateString()} at{' '}
                      {new Date(view.timestamp).toLocaleTimeString()}
                    </p>
                    {(view.country || view.deviceType) && (
                      <p className="text-xs text-gray-400 mt-1">
                        {[view.country, view.deviceType].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </div>
                  {view.timeSpentSeconds && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {Math.round(view.timeSpentSeconds / 60)}m
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">No views yet</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Viewers */}
      {recentViewers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Viewers</CardTitle>
            <CardDescription>People who viewed your resume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentViewers.map((viewer, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {viewer.viewerName || viewer.viewerEmail || 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Last viewed {new Date(viewer.lastViewedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{viewer.viewCount}</p>
                    <p className="text-xs text-gray-500">views</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
