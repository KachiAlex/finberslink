'use client';

import { FC } from 'react';

interface SkillAnalysisProps {
  skills?: string[];
  onAnalyze?: (skills: string[]) => void;
}

export const SkillAnalysis: FC<SkillAnalysisProps> = ({
  skills = [],
  onAnalyze,
}) => {
  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">Skills Analysis</div>
      <div className="space-y-2">
        {skills.map((skill, index) => (
          <div key={index} className="p-2 border rounded bg-gray-50">
            {skill}
          </div>
        ))}
      </div>
    </div>
  );
};
