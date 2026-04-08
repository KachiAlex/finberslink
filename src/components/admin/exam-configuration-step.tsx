"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Clock, Target, CheckCircle, Trash, Plus, X } from "lucide-react";
import type { SectionExam } from "./course-edit-modal-enhanced";

interface ExamConfigurationStepProps {
  sections: any[];
  setSections: (sections: any[]) => void;
}

export function ExamConfigurationStep({ sections, setSections }: ExamConfigurationStepProps) {
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [examConfig, setExamConfig] = useState<SectionExam>({
    id: '',
    title: '',
    passScore: 70,
    timeLimit: 60,
    isEnabled: false
  });
  const [cbtFile, setCbtFile] = useState<File | null>(null);

  const addExam = (sectionId: string) => {
    if (!examConfig.title.trim()) return;

    const newExam: SectionExam = {
      id: `exam_${Date.now()}`,
      title: examConfig.title,
      passScore: examConfig.passScore,
      timeLimit: examConfig.timeLimit,
      isEnabled: examConfig.isEnabled,
      cbtFile: cbtFile?.name
    };

    // Update section with exam
    const updatedSections = sections.map(section =>
      section.id === sectionId
        ? { ...section, exam: newExam }
        : section
    );
    setSections(updatedSections);

    // Reset form
    setExamConfig({
      id: '',
      title: '',
      passScore: 70,
      timeLimit: 60,
      isEnabled: false
    });
    setCbtFile(null);
    setSelectedSectionId('');
  };

  const updateExam = (section: any) => {
    if (section.exam) {
      setExamConfig(section.exam);
      setCbtFile(section.exam.cbtFile ? { name: section.exam.cbtFile } : null);
    }
  };

  const removeExam = (sectionId: string) => {
    const updatedSections = sections.map(section =>
      section.id === sectionId
        ? { ...section, exam: undefined }
        : section
    );
    setSections(updatedSections);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCbtFile(file);
    }
  };

  return (
    <div className="space-y-6 text-black">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Sections with Exams */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              Exam Configuration
            </h3>
            <Badge variant="secondary" className="text-xs">
              {sections.filter(s => s.exam?.isEnabled).length} Exams Configured
            </Badge>
          </div>

          {/* Sections List */}
          <div className="space-y-2">
            {sections.map((section) => (
              <Card 
                key={section.id} 
                className={`cursor-pointer transition-all ${
                  selectedSectionId === section.id 
                    ? 'ring-2 ring-orange-500 bg-orange-50' 
                    : 'hover:shadow-md hover:bg-gray-50'
                }`}
                onClick={() => {
                  setSelectedSectionId(section.id);
                  updateExam(section);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-black">{section.title}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={section.exam?.isEnabled ? "default" : "secondary"} className="text-xs">
                          {section.exam?.isEnabled ? 'Exam Enabled' : 'No Exam'}
                        </Badge>
                        {section.exam && (
                          <Badge variant="outline" className="text-xs ml-2">
                            {section.exam.passScore}% to pass • {section.exam.timeLimit}min
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {section.exam && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeExam(section.id);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Panel - Exam Configuration */}
        <div className="space-y-4">
          {selectedSectionId ? (
            <>
              <h3 className="text-lg font-semibold text-black mb-4">
                Configure Exam for: {sections.find(s => s.id === selectedSectionId)?.title}
              </h3>
              
              {/* Exam Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-black">Exam Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="examTitle" className="block text-sm font-medium text-black mb-2">Exam Title</Label>
                    <Input
                      id="examTitle"
                      value={examConfig.title}
                      onChange={(e) => setExamConfig({ ...examConfig, title: e.target.value })}
                      placeholder="Enter exam title"
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="passScore" className="block text-sm font-medium text-black mb-2">Pass Score (%)</Label>
                      <Input
                        id="passScore"
                        type="number"
                        value={examConfig.passScore}
                        onChange={(e) => setExamConfig({ ...examConfig, passScore: parseInt(e.target.value) || 70 })}
                        min="0"
                        max="100"
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="timeLimit" className="block text-sm font-medium text-black mb-2">Time Limit (minutes)</Label>
                      <Input
                        id="timeLimit"
                        type="number"
                        value={examConfig.timeLimit}
                        onChange={(e) => setExamConfig({ ...examConfig, timeLimit: parseInt(e.target.value) || 60 })}
                        min="1"
                        max="180"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cbtFile" className="block text-sm font-medium text-black mb-2">CBT File (Excel)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="cbtFile"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        className="flex-1"
                        placeholder="Upload Excel CBT file"
                      />
                      {cbtFile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCbtFile(null)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {cbtFile && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-700">{cbtFile.name}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={examConfig.isEnabled}
                        onChange={(e) => setExamConfig({ ...examConfig, isEnabled: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-black">Enable Exam for this Section</span>
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={() => addExam(selectedSectionId)}
                  disabled={!examConfig.title.trim() || !selectedSectionId}
                  className="bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Exam to Section
                </Button>
                
                {sections.find(s => s.id === selectedSectionId)?.exam && (
                  <Button 
                    onClick={() => removeExam(selectedSectionId)}
                    variant="destructive"
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Remove Exam
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Select a section to configure its exam</p>
            </div>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h4 className="font-medium text-orange-900 mb-2">Exam Configuration Progress</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-orange-700">
              {sections.filter(s => s.exam?.isEnabled).length} sections with exams configured
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-orange-700">
              {sections.reduce((total, section) => total + (section.exam?.timeLimit || 0), 0)} total exam minutes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-orange-700">
              {sections.filter(s => s.exam?.isEnabled).length} exams ready for deployment
            </span>
          </div>
        </div>
        <p className="text-xs text-orange-600 mt-2">
          Tip: Upload Excel CBT files, configure pass scores and time limits, then enable exams for student access
        </p>
      </div>
    </div>
  );
}
