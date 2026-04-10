'use client';

import React from 'react';
import { Mic, BookOpen, BarChart3, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Card className="border-dashed border-slate-200 bg-slate-50/80">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        {icon}
        <p className="text-base font-semibold text-slate-800">{title}</p>
        <p className="max-w-md text-sm text-slate-600">{description}</p>
        {action && (
          <Button onClick={action.onClick} className="rounded-full mt-2">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function NoSessionsEmpty({ onCreateSession }: { onCreateSession: () => void }) {
  return (
    <EmptyState
      icon={<Mic className="h-10 w-10 text-slate-400" />}
      title="No mock interviews yet"
      description="Launch your first session to get AI-powered feedback on delivery, content depth, and role-specific readiness."
      action={{
        label: 'Start your first interview',
        onClick: onCreateSession,
      }}
    />
  );
}

export function NoQuestionsEmpty() {
  return (
    <EmptyState
      icon={<BookOpen className="h-10 w-10 text-slate-400" />}
      title="No questions selected"
      description="Select at least one question from the question bank to begin your interview practice."
      action={{
        label: 'Browse questions',
        onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
      }}
    />
  );
}

export function NoAnalyticsEmpty() {
  return (
    <EmptyState
      icon={<BarChart3 className="h-10 w-10 text-slate-400" />}
      title="No analytics yet"
      description="Complete interview sessions to see your performance analytics and skill development over time."
    />
  );
}

export function NoSkillsEmpty() {
  return (
    <EmptyState
      icon={<Plus className="h-10 w-10 text-slate-400" />}
      title="No skills identified"
      description="Complete more interviews to extract and analyze your key competencies and skill development."
    />
  );
}

export function NoTrendsEmpty() {
  return (
    <EmptyState
      icon={<BarChart3 className="h-10 w-10 text-slate-400" />}
      title="No score trends yet"
      description="Complete multiple interviews to see your performance trends and progress over time."
    />
  );
}
