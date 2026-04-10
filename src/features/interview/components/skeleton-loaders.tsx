'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function SessionCardSkeleton() {
  return (
    <Card className="border-slate-200 bg-white/95">
      <CardHeader className="space-y-3">
        <div className="space-y-2">
          <div className="h-3 w-20 rounded bg-slate-200 animate-pulse" />
          <div className="h-6 w-40 rounded bg-slate-100 animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-24 rounded-full bg-slate-100 animate-pulse" />
          <div className="h-6 w-32 rounded-full bg-slate-100 animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-3">
          <div className="h-3 w-16 rounded bg-slate-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-slate-100 animate-pulse" />
            <div className="h-4 w-28 rounded bg-slate-100 animate-pulse" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-32 rounded-full bg-slate-200 animate-pulse" />
          <div className="h-9 w-20 rounded-full bg-slate-100 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ChartSkeleton() {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="h-5 w-32 rounded bg-slate-200 animate-pulse" />
        <div className="h-4 w-48 rounded bg-slate-100 animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full rounded bg-slate-50 animate-pulse" />
      </CardContent>
    </Card>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
            <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
          </div>
          <div className="h-8 w-16 rounded bg-slate-200 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-8 w-16 rounded bg-slate-100 animate-pulse" />
              <div className="h-3 w-32 rounded bg-slate-50 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <ChartSkeleton />

      {/* List */}
      <Card>
        <CardHeader>
          <div className="h-5 w-32 rounded bg-slate-200 animate-pulse" />
        </CardHeader>
        <CardContent>
          <ListSkeleton count={4} />
        </CardContent>
      </Card>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
          <div className="h-10 w-full rounded bg-slate-100 animate-pulse" />
        </div>
      ))}
      <div className="flex gap-2 pt-4">
        <div className="h-10 w-32 rounded bg-slate-200 animate-pulse" />
        <div className="h-10 w-20 rounded bg-slate-100 animate-pulse" />
      </div>
    </div>
  );
}
