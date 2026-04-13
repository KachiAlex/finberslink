'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TrendPoint {
  date: string;
  value: number;
  change: number;
}

interface SectionEngagementData {
  sectionName: string;
  viewCount: number;
  timeSpentSeconds: number;
  scrollDepth: number;
  engagementPercentage: number;
  rank: number;
}

interface AnalyticsChartsProps {
  viewTrends: TrendPoint[];
  downloadTrends: TrendPoint[];
  shareTrends: TrendPoint[];
  sectionEngagement: SectionEngagementData[];
}

/**
 * Simple line chart component using SVG
 */
function SimpleLineChart({ data, title }: { data: TrendPoint[]; title: string }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-8">No data available</p>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const width = 400;
  const height = 200;
  const padding = 40;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * chartWidth;
    const y = height - padding - (d.value / maxValue) * chartHeight;
    return { x, y, value: d.value };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <svg width={width} height={height} className="w-full border rounded">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <line
              key={`grid-${i}`}
              x1={padding}
              y1={height - padding - ratio * chartHeight}
              x2={width - padding}
              y2={height - padding - ratio * chartHeight}
              stroke="#e5e7eb"
              strokeDasharray="4"
            />
          ))}

          {/* Axes */}
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#000" strokeWidth="2" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#000" strokeWidth="2" />

          {/* Line */}
          <path d={pathD} stroke="#3b82f6" strokeWidth="2" fill="none" />

          {/* Points */}
          {points.map((p, i) => (
            <circle key={`point-${i}`} cx={p.x} cy={p.y} r="4" fill="#3b82f6" />
          ))}

          {/* Y-axis labels */}
          {[0, 0.5, 1].map((ratio, i) => (
            <text
              key={`y-label-${i}`}
              x={padding - 10}
              y={height - padding - ratio * chartHeight + 4}
              textAnchor="end"
              fontSize="12"
              fill="#666"
            >
              {Math.round(ratio * maxValue)}
            </text>
          ))}
        </svg>
      </CardContent>
    </Card>
  );
}

/**
 * Simple bar chart component using SVG
 */
function SimpleBarChart({ data }: { data: SectionEngagementData[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Section Engagement</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-8">No data available</p>
        </CardContent>
      </Card>
    );
  }

  const maxEngagement = Math.max(...data.map(d => d.engagementPercentage), 1);
  const width = 400;
  const height = 250;
  const padding = 40;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;
  const barWidth = chartWidth / data.length * 0.8;
  const barSpacing = chartWidth / data.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Section Engagement</CardTitle>
        <CardDescription>Engagement percentage by section</CardDescription>
      </CardHeader>
      <CardContent>
        <svg width={width} height={height} className="w-full border rounded">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <line
              key={`grid-${i}`}
              x1={padding}
              y1={height - padding - ratio * chartHeight}
              x2={width - padding}
              y2={height - padding - ratio * chartHeight}
              stroke="#e5e7eb"
              strokeDasharray="4"
            />
          ))}

          {/* Axes */}
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#000" strokeWidth="2" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#000" strokeWidth="2" />

          {/* Bars */}
          {data.map((section, i) => {
            const barHeight = (section.engagementPercentage / maxEngagement) * chartHeight;
            const x = padding + i * barSpacing + (barSpacing - barWidth) / 2;
            const y = height - padding - barHeight;

            return (
              <g key={`bar-${i}`}>
                <rect x={x} y={y} width={barWidth} height={barHeight} fill="#3b82f6" />
                <text
                  x={x + barWidth / 2}
                  y={height - padding + 20}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#666"
                >
                  {section.sectionName.substring(0, 8)}
                </text>
              </g>
            );
          })}

          {/* Y-axis labels */}
          {[0, 0.5, 1].map((ratio, i) => (
            <text
              key={`y-label-${i}`}
              x={padding - 10}
              y={height - padding - ratio * chartHeight + 4}
              textAnchor="end"
              fontSize="12"
              fill="#666"
            >
              {Math.round(ratio * maxEngagement)}%
            </text>
          ))}
        </svg>
      </CardContent>
    </Card>
  );
}

export function AnalyticsCharts({
  viewTrends,
  downloadTrends,
  shareTrends,
  sectionEngagement,
}: AnalyticsChartsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleLineChart data={viewTrends} title="View Trends" />
        <SimpleLineChart data={downloadTrends} title="Download Trends" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleLineChart data={shareTrends} title="Share Trends" />
        <SimpleBarChart data={sectionEngagement} />
      </div>
    </div>
  );
}
