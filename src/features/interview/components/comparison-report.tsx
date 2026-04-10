'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { RolePercentile } from '@/features/interview/analytics-service';

interface ComparisonReportProps {
  percentile: RolePercentile;
}

export function ComparisonReport({ percentile }: ComparisonReportProps) {
  const getPercentileLabel = (p: number | null) => {
    if (p === null) return 'N/A';
    if (p >= 90) return 'Top 10%';
    if (p >= 75) return 'Top 25%';
    if (p >= 50) return 'Above Average';
    if (p >= 25) return 'Below Average';
    return 'Bottom 25%';
  };

  const getPercentileColor = (p: number | null) => {
    if (p === null) return 'bg-slate-100 text-slate-800';
    if (p >= 90) return 'bg-emerald-100 text-emerald-800';
    if (p >= 75) return 'bg-blue-100 text-blue-800';
    if (p >= 50) return 'bg-amber-100 text-amber-800';
    return 'bg-rose-100 text-rose-800';
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">{percentile.role}</h3>
        <Badge className={`text-xs ${getPercentileColor(percentile.percentile)}`} variant="outline">
          {getPercentileLabel(percentile.percentile)}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-slate-600 mb-1">Your Score</p>
          <p className="text-2xl font-bold text-indigo-600">
            {percentile.userScore !== null ? `${percentile.userScore.toFixed(1)}%` : 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-600 mb-1">Role Average</p>
          <p className="text-2xl font-bold text-slate-600">
            {percentile.roleAverage !== null ? `${percentile.roleAverage.toFixed(1)}%` : 'N/A'}
          </p>
        </div>
      </div>

      {percentile.userScore !== null && percentile.roleAverage !== null && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Performance vs. Average</span>
            <span className="font-medium text-slate-900">
              {percentile.userScore > percentile.roleAverage ? '+' : ''}
              {(percentile.userScore - percentile.roleAverage).toFixed(1)}%
            </span>
          </div>
          <Progress
            value={Math.min(100, (percentile.userScore / percentile.roleAverage) * 100)}
            className="h-2"
          />
        </div>
      )}

      {percentile.percentile !== null && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Percentile Rank</span>
            <span className="font-medium text-slate-900">{percentile.percentile}th</span>
          </div>
          <Progress value={percentile.percentile} className="h-2" />
        </div>
      )}

      {percentile.userScore !== null && percentile.roleAverage !== null && (
        <div className="pt-2 border-t">
          {percentile.userScore > percentile.roleAverage ? (
            <p className="text-sm text-emerald-700">
              ✓ You're performing above the role average. Keep up the great work!
            </p>
          ) : percentile.userScore < percentile.roleAverage ? (
            <p className="text-sm text-amber-700">
              → Focus on areas where you can improve to match the role average.
            </p>
          ) : (
            <p className="text-sm text-slate-700">
              → You're at the role average. Continue practicing to improve further.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
