'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { SkillAnalysis as SkillAnalysisType } from '@/features/interview/analytics-service';

interface SkillAnalysisProps {
  skills: SkillAnalysisType[];
}

const PROFICIENCY_COLORS = {
  beginner: 'bg-amber-100 text-amber-800',
  intermediate: 'bg-blue-100 text-blue-800',
  advanced: 'bg-emerald-100 text-emerald-800',
};

const PROFICIENCY_PROGRESS = {
  beginner: 33,
  intermediate: 66,
  advanced: 100,
};

export function SkillAnalysis({ skills }: SkillAnalysisProps) {
  if (skills.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        No skills identified yet
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {skills.map((skill) => (
        <div key={skill.name} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="font-medium text-slate-900 capitalize">{skill.name}</p>
              <Badge
                className={`text-xs ${PROFICIENCY_COLORS[skill.proficiency]}`}
                variant="outline"
              >
                {skill.proficiency}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">{skill.mentions} mention{skill.mentions !== 1 ? 's' : ''}</p>
          </div>

          <Progress
            value={PROFICIENCY_PROGRESS[skill.proficiency]}
            className="h-2"
          />

          {skill.trend && (
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <span>Trend:</span>
              <span className={
                skill.trend === 'improving'
                  ? 'text-emerald-600 font-medium'
                  : skill.trend === 'declining'
                    ? 'text-rose-600 font-medium'
                    : 'text-slate-600'
              }>
                {skill.trend === 'improving' && '📈 Improving'}
                {skill.trend === 'stable' && '➡️ Stable'}
                {skill.trend === 'declining' && '📉 Declining'}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
