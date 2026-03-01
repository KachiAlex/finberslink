"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus } from "lucide-react";
import { useState } from "react";

interface SkillAnalysis {
  hardSkills: string[];
  softSkills: string[];
  suggestedSkills: string[];
  prioritySkills: string[];
}

interface SkillAnalysisProps {
  analysis: SkillAnalysis;
  onAccept: (selectedSkills: { hard: string[]; soft: string[]; suggested: string[] }) => void;
  onReject: () => void;
  isLoading?: boolean;
}

export function SkillAnalysis({
  analysis,
  onAccept,
  onReject,
  isLoading = false,
}: SkillAnalysisProps) {
  const [selectedHardSkills, setSelectedHardSkills] = useState<string[]>(analysis.hardSkills);
  const [selectedSoftSkills, setSelectedSoftSkills] = useState<string[]>(analysis.softSkills);
  const [selectedSuggestedSkills, setSelectedSuggestedSkills] = useState<string[]>(analysis.suggestedSkills);

  const toggleSkill = (skill: string, category: 'hard' | 'soft' | 'suggested') => {
    const setter = category === 'hard' ? setSelectedHardSkills :
                   category === 'soft' ? setSelectedSoftSkills :
                   setSelectedSuggestedSkills;
    
    setter(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const addCustomSkill = (category: 'hard' | 'soft' | 'suggested') => {
    const skill = prompt(`Add a custom ${category} skill:`);
    if (skill && skill.trim()) {
      const setter = category === 'hard' ? setSelectedHardSkills :
                     category === 'soft' ? setSelectedSoftSkills :
                     setSelectedSuggestedSkills;
      setter(prev => [...prev, skill.trim()]);
    }
  };

  const handleAccept = () => {
    onAccept({
      hard: selectedHardSkills,
      soft: selectedSoftSkills,
      suggested: selectedSuggestedSkills,
    });
  };

  if (isLoading) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            AI is analyzing your skills...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-700">
            This usually takes 10-15 seconds. Please wait...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="text-lg text-green-800">
          AI Skill Analysis
        </CardTitle>
        <p className="text-sm text-green-600">
          Review and select the skills that best represent your expertise:
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Priority Skills */}
        {analysis.prioritySkills.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 text-amber-700">Priority Skills</h4>
            <p className="text-xs text-amber-600 mb-2">Most relevant for your target role</p>
            <div className="flex flex-wrap gap-2">
              {analysis.prioritySkills.map((skill) => (
                <Badge key={skill} variant="secondary" className="bg-amber-100 text-amber-800">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Hard Skills */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">Technical Skills</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => addCustomSkill('hard')}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.hardSkills.map((skill) => (
              <Badge
                key={skill}
                variant={selectedHardSkills.includes(skill) ? "default" : "outline"}
                className={`cursor-pointer ${
                  selectedHardSkills.includes(skill)
                    ? "bg-blue-600 text-white"
                    : "hover:bg-blue-100"
                }`}
                onClick={() => toggleSkill(skill, 'hard')}
              >
                {skill}
                {selectedHardSkills.includes(skill) && (
                  <X className="w-3 h-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
        </div>

        {/* Soft Skills */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">Soft Skills</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => addCustomSkill('soft')}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.softSkills.map((skill) => (
              <Badge
                key={skill}
                variant={selectedSoftSkills.includes(skill) ? "default" : "outline"}
                className={`cursor-pointer ${
                  selectedSoftSkills.includes(skill)
                    ? "bg-green-600 text-white"
                    : "hover:bg-green-100"
                }`}
                onClick={() => toggleSkill(skill, 'soft')}
              >
                {skill}
                {selectedSoftSkills.includes(skill) && (
                  <X className="w-3 h-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
        </div>

        {/* Suggested Skills */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">Suggested Skills</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => addCustomSkill('suggested')}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          </div>
          <p className="text-xs text-gray-600 mb-2">Skills that could enhance your profile</p>
          <div className="flex flex-wrap gap-2">
            {analysis.suggestedSkills.map((skill) => (
              <Badge
                key={skill}
                variant={selectedSuggestedSkills.includes(skill) ? "default" : "outline"}
                className={`cursor-pointer ${
                  selectedSuggestedSkills.includes(skill)
                    ? "bg-purple-600 text-white"
                    : "hover:bg-purple-100"
                }`}
                onClick={() => toggleSkill(skill, 'suggested')}
              >
                {skill}
                {selectedSuggestedSkills.includes(skill) && (
                  <X className="w-3 h-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleAccept}
            className="flex-1"
          >
            Accept Selected Skills
          </Button>
          <Button variant="outline" onClick={onReject}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
