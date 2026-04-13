'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, Eye, FileDown, Share2, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { AnalyticsCharts } from './analytics-charts';

interface AnalyticsSummary {
  totalViews: number;
  totalDownloads: number;
  totalShares: number;
  totalExports: number;
  uniqueViewers: number;
  viewToDownloadRatio: number;
  shareToViewRatio: number;
}

interface TrendPoint {
  date: string;
  value: number;
  change: number;
}

interface SectionEngagement {
  sectionName: string;
  viewCount: number;
  timeSpentSeconds: number;
  scrollDepth: number;
  engagementPercentage: number;
  rank: number;
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
    views: TrendPoint[];
    downloads: TrendPoint[];
    shares: TrendPoint[];
    exports: TrendPoint[];
  };
  sectionEngagement: SectionEngagement[];
  viewHistory: ViewRecord[];
  recentViewers: ViewerInfo[];
}

interface ComparisonMetrics {
  period1: {
    totalViews: number;
    totalDownloads: number;
    totalShares: number;
  };
  period2: {
    totalViews: number;
    totalDownloads: number;
    totalShares: number;
  };
  growth: {
    viewsChange: number;
    viewsAbsoluteChange: number;
    downloadsChange: number;
    downloadsAbsoluteChange: number;
    sharesChange: number;
    sharesAbsoluteChange: number;
  };
}

interface EnhancedAnalyticsDashboardProps {
  resumeId: string;
  resumeTitle?: string;
}

export function EnhancedAnalyticsDashboard({ resumeId, resumeTitle = 'Resume' }: EnhancedAnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [showComparison, setShowComparison] = useState(false);
  const [showCharts, setShowCharts] = useState(true);
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);

    try {
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

      // Fetch comparison data if enabled
      if (showComparison) {
        await fetchComparison();
      }
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

  const fetchComparison = async () => {
    try {
      const now = new Date();
      let startDate1: Date, endDate1: Date, startDate2: Date, endDate2: Date;

      if (dateRange === '7d') {
        endDate1 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate1 = new Date(endDate1.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate2 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate2 = now;
      } else if (dateRange === '30d') {
        endDate1 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate1 = new Date(endDate1.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate2 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate2 = now;
      } else {
        return; // No comparison for 90d or all time
      }

      const response = await fetch('/api/resume/analytics/comparison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId,
          startDate1: startDate1.toISOString(),
          endDate1: endDate1.toISOString(),
          startDate2: startDate2.toISOString(),
          endDate2: endDate2.toISOString(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setComparisonData(result.comparison);
      }
    } catch (err) {
      console.error('Error fetching comparison data:', err);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(true);

    try {
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
      params.append('resumeId', resumeId);
      params.append('format', format);
      if (startDate) params.append('startDate', startDate.toISOString());
      params.append('endDate', endDate.toISOString());

      const response = await fetch(`/api/resume/analytics/export?${params}`);

      if (!response.ok) {
        throw new Error('Failed to export analytics');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: `Analytics exported as ${format.toUpperCase()}`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
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

  const { summary, trends, viewHistory, recentViewers, sectionEngagement } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-sm text-gray-600 mt-1">{resumeTitle}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
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
          <Button onClick={() => handleExport('csv')} variant="outline" size="sm" disabled={isExporting} className="gap-2">
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button onClick={() => handleExport('pdf')} variant="outline" size="sm" disabled={isExporting} className="gap-2">
            <Download className="h-4 w-4" />
            PDF
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

      {/* Comparison Metrics */}
      {showComparison && comparisonData && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-sm">Period Comparison</CardTitle>
            <CardDescription>Week-over-week growth metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Views Growth</p>
                <div className="flex items-center gap-2">
                  {comparisonData.growth.viewsChange >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={comparisonData.growth.viewsChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {comparisonData.growth.viewsChange >= 0 ? '+' : ''}{comparisonData.growth.viewsChange.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500">
                    ({comparisonData.growth.viewsAbsoluteChange >= 0 ? '+' : ''}{comparisonData.growth.viewsAbsoluteChange})
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Downloads Growth</p>
                <div className="flex items-center gap-2">
                  {comparisonData.growth.downloadsChange >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={comparisonData.growth.downloadsChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {comparisonData.growth.downloadsChange >= 0 ? '+' : ''}{comparisonData.growth.downloadsChange.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500">
                    ({comparisonData.growth.downloadsAbsoluteChange >= 0 ? '+' : ''}{comparisonData.growth.downloadsAbsoluteChange})
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Shares Growth</p>
                <div className="flex items-center gap-2">
                  {comparisonData.growth.sharesChange >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={comparisonData.growth.sharesChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {comparisonData.growth.sharesChange >= 0 ? '+' : ''}{comparisonData.growth.sharesChange.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500">
                    ({comparisonData.growth.sharesAbsoluteChange >= 0 ? '+' : ''}{comparisonData.growth.sharesAbsoluteChange})
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      {showCharts && (
        <AnalyticsCharts
          viewTrends={trends.views}
          downloadTrends={trends.downloads}
          shareTrends={trends.shares}
          sectionEngagement={sectionEngagement}
        />
      )}

      {/* Section Engagement */}
      {sectionEngagement.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Section Engagement Ranking</CardTitle>
            <CardDescription>Sections ranked by engagement level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sectionEngagement.map((section) => (
                <div key={section.sectionName} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">#{section.rank}</span>
                      <span className="text-sm font-medium">{section.sectionName}</span>
                    </div>
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
                  <p className="text-xs text-gray-500">
                    {Math.round(section.timeSpentSeconds / 60)}m avg • {section.scrollDepth}% scroll depth
                  </p>
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
                    <p className="text-sm font-medium">{view.viewerEmail || 'Anonymous'}</p>
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
                      <p className="text-xs text-gray-500">{Math.round(view.timeSpentSeconds / 60)}m</p>
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
                    <p className="text-sm font-medium">{viewer.viewerName || viewer.viewerEmail || 'Anonymous'}</p>
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
