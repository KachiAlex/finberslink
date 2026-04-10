'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { UserAnalytics } from '@/features/interview/analytics-service';
import { ScoreTrendChart } from './score-trend-chart';
import { SkillAnalysis } from './skill-analysis';
import { ComparisonReport } from './comparison-report';
import { NoAnalyticsEmpty, NoSkillsEmpty, NoTrendsEmpty } from './empty-states';
import { AnalyticsSkeleton } from './skeleton-loaders';
import { ErrorAlert } from './error-boundary';

interface AnalyticsDashboardProps {
  userId?: string;
}

export function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/interview/analytics/user');
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [userId]);

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <ErrorAlert
        error={error}
        onRetry={() => window.location.reload()}
        title="Failed to load analytics"
      />
    );
  }

  if (!analytics) {
    return <NoAnalyticsEmpty />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.totalSessions}</div>
            <p className="text-xs text-slate-500 mt-1">Interview practice sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {analytics.averageScore !== null ? `${analytics.averageScore.toFixed(1)}%` : 'N/A'}
            </div>
            <p className="text-xs text-slate-500 mt-1">Across all sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Roles Practiced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.roleAverages.length}</div>
            <p className="text-xs text-slate-500 mt-1">Different roles</p>
          </CardContent>
        </Card>
      </div>

      {/* Score Trends */}
      {analytics.scoreTrends.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Score Trends</CardTitle>
            <CardDescription>Your performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ScoreTrendChart trends={analytics.scoreTrends} />
          </CardContent>
        </Card>
      ) : (
        <NoTrendsEmpty />
      )}

      {/* Skills Analysis */}
      {analytics.skillsAnalysis.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Skills Analysis</CardTitle>
            <CardDescription>Key competencies identified from your interviews</CardDescription>
          </CardHeader>
          <CardContent>
            <SkillAnalysis skills={analytics.skillsAnalysis} />
          </CardContent>
        </Card>
      ) : (
        <NoSkillsEmpty />
      )}

      {/* Role Comparison */}
      {analytics.percentiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Role Comparison</CardTitle>
            <CardDescription>Your performance vs. role averages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.percentiles.map((percentile) => (
                <ComparisonReport key={percentile.role} percentile={percentile} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Breakdown */}
      {analytics.roleAverages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Role Breakdown</CardTitle>
            <CardDescription>Performance by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.roleAverages.map((role) => (
                <div key={role.role} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{role.role}</p>
                    <p className="text-sm text-slate-500">{role.sessionCount} session{role.sessionCount !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-indigo-600">
                      {role.averageScore !== null ? `${role.averageScore.toFixed(1)}%` : 'N/A'}
                    </p>
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
