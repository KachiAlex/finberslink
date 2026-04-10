'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { ScoreTrend } from '@/features/interview/analytics-service';

interface ScoreTrendChartProps {
  trends: ScoreTrend[];
}

export function ScoreTrendChart({ trends }: ScoreTrendChartProps) {
  const chartData = useMemo(() => {
    return trends
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((trend) => ({
        date: new Date(trend.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        score: trend.score,
        role: trend.role,
        fullDate: new Date(trend.date),
      }));
  }, [trends]);

  const averageScore = useMemo(() => {
    const scores = chartData.filter((d) => d.score !== null).map((d) => d.score || 0);
    if (scores.length === 0) return null;
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100;
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        No score data available
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
            domain={[0, 100]}
            label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value) => {
              if (value === null) return 'No score';
              return `${(value as number).toFixed(1)}%`;
            }}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          {averageScore !== null && (
            <ReferenceLine
              y={averageScore}
              stroke="#94a3b8"
              strokeDasharray="5 5"
              label={{
                value: `Average: ${averageScore.toFixed(1)}%`,
                position: 'right',
                fill: '#64748b',
                fontSize: 12,
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="score"
            stroke="#4f46e5"
            strokeWidth={2}
            dot={{ fill: '#4f46e5', r: 4 }}
            activeDot={{ r: 6 }}
            name="Score"
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
