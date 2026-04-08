"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash, Layers3, BookOpen, Target, FileText, Upload, CheckCircle, X } from "lucide-react";
import type { CourseSection, CourseModule, SectionExam } from "./course-edit-modal-enhanced";

interface CourseStructureStepProps {
  sections: CourseSection[];
  setSections: (sections: CourseSection[]) => void;
  modules: CourseModule[];
  setModules: (modules: CourseModule[]) => void;
}

export function CourseStructureStep({ sections, setSections, modules, setModules }: CourseStructureStepProps) {
  const [selectedSection, setSelectedSection] = useState<CourseSection | null>(null);
  const [selectedModule, setSelectedModule] = useState<CourseModule | null>(null);
  const [currentMode, setCurrentMode] = useState<'section' | 'module' | 'exam'>('section');

  // Section Management
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionDescription, setNewSectionDescription] = useState('');
  const [newSectionObjectives, setNewSectionObjectives] = useState<string[]>([]);

  // Module Management
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleContent, setNewModuleContent] = useState('');

  // Exam Management
  const [examConfig, setExamConfig] = useState<SectionExam>({
    id: '',
    title: '',
    passScore: 70,
    timeLimit: 60,
    isEnabled: false
  });

  const addSection = () => {
    if (newSectionTitle.trim()) {
      const newSection: CourseSection = {
        id: `section_${Date.now()}`,
        title: newSectionTitle,
        description: newSectionDescription,
        objectives: newSectionObjectives,
        modules: [],
        order: sections.length
      };
      setSections([...sections, newSection]);
      setNewSectionTitle('');
      setNewSectionDescription('');
      setNewSectionObjectives([]);
    }
  };

  const addModule = (sectionId: string) => {
    if (newModuleTitle.trim()) {
      const newModule: CourseModule = {
        id: `module_${Date.now()}`,
        title: newModuleTitle,
        content: newModuleContent,
        resources: [],
        duration: 30,
        order: modules.length
      };
      setModules([...modules, newModule]);
      
      // Add module to selected section
      const updatedSections = sections.map(section => 
        section.id === sectionId 
          ? { ...section, modules: [...section.modules, newModule] }
          : section
      );
      setSections(updatedSections);
      
      setNewModuleTitle('');
      setNewModuleContent('');
    }
  };

  const removeSection = (sectionId: string) => {
    const newSections = sections.filter(section => section.id !== sectionId);
    setSections(newSections);
    if (selectedSection?.id === sectionId) {
      setSelectedSection(null);
    }
  };

  const removeModule = (moduleId: string) => {
    const newModules = modules.filter(module => module.id !== moduleId);
    setModules(newModules);
    
    // Remove module from all sections
    const updatedSections = sections.map(section => ({
      ...section,
      modules: section.modules.filter(module => module.id !== moduleId)
    }));
    setSections(updatedSections);
    
    if (selectedModule?.id === moduleId) {
      setSelectedModule(null);
    }
  };

  const addObjective = () => {
    setNewSectionObjectives([...newSectionObjectives, '']);
  };

  const updateObjective = (index: number, value: string) => {
    const updated = [...newSectionObjectives];
    updated[index] = value;
    setNewSectionObjectives(updated);
  };

  const removeObjective = (index: number) => {
    setNewSectionObjectives(newSectionObjectives.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 text-black">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Sections List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-blue-600" />
              Course Sections
            </h3>
            <Button 
              onClick={() => {
                setSelectedSection(null);
                setSelectedModule(null);
                setCurrentMode('section');
              }}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Section
            </Button>
          </div>

          {/* Sections List */}
          <div className="space-y-2">
            {sections.map((section: CourseSection) => (
              <Card 
                key={section.id} 
                className={`cursor-pointer transition-all ${
                  selectedSection?.id === section.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-md hover:bg-gray-50'
                }`}
                onClick={() => setSelectedSection(section)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-black">{section.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {section.modules.map((module, index) => (
                          <Badge key={module.id} variant="secondary" className="text-xs">
                            Module {index + 1}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSection(section.id);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Middle Panel - Section/Module Details */}
        <div className="space-y-4">
          <>
            {selectedSection ? (
                <h3 className="text-lg font-semibold text-black mb-4">
                  Edit Section: {selectedSection.title}
                </h3>
                
                {/* Section Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base text-black">Section Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Section Title</label>
                      <Input
                        value={selectedSection.title}
                        onChange={(e) => {
                          const updated = sections.map(section =>
                            section.id === selectedSection.id
                              ? { ...section, title: e.target.value }
                              : section
                          );
                          setSections(updated);
                          setSelectedSection({ ...selectedSection, title: e.target.value });
                        }}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Description</label>
                      <Textarea
                        value={selectedSection.description}
                        onChange={(e) => {
                          const updated = sections.map(section =>
                            section.id === selectedSection.id
                              ? { ...section, description: e.target.value }
                              : section
                          );
                          setSections(updated);
                          setSelectedSection({ ...selectedSection, description: e.target.value });
                        }}
                        rows={3}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Learning Objectives</label>
                      <div className="space-y-2">
                        {selectedSection.objectives.map((objective, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={objective}
                              onChange={(e) => updateObjective(index, e.target.value)}
                              placeholder={`Objective ${index + 1}`}
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeObjective(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                        onClick={addObjective}
                        variant="outline"
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Objective
                      </Button>
                    </div>
                  </div>
                </CardContent>
                </Card>

                {/* Module Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base text-black">Modules in this Section</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Input
                        value={newModuleTitle}
                        onChange={(e) => setNewModuleTitle(e.target.value)}
                        placeholder="New module title"
                        className="flex-1"
                      />
                      <Button 
                        onClick={() => addModule(selectedSection.id)}
                        className="bg-green-600 text-white hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Module
                      </Button>
                      </div>

                      {/* Modules List */}
                      <div className="space-y-2">
                        {selectedSection.modules.map((module, index) => (
                          <Card key={module.id} className="bg-gray-50">
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <h5 className="font-medium text-black">{module.title}</h5>
                                <div className="flex gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setSelectedModule(module)}
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => removeModule(module.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                Duration: {module.duration} minutes
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Select a section to edit its details</p>
                </div>
              )}
        </div>

        {/* Right Panel - Module Editor or Exam Config */}
        <div className="space-y-4">
          {selectedModule ? (
            <>
              <h3 className="text-lg font-semibold text-black mb-4">
                Edit Module: {selectedModule.title}
              </h3>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-black">Module Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Module Title</label>
                    <Input
                      value={selectedModule.title}
                      onChange={(e) => {
                        const updated = modules.map(module =>
                          module.id === selectedModule.id
                            ? { ...module, title: e.target.value }
                            : module
                        );
                        setModules(updated);
                        setSelectedModule({ ...selectedModule, title: e.target.value });
                      }}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Content</label>
                    <Textarea
                      value={selectedModule.content}
                      onChange={(e) => {
                        const updated = modules.map(module =>
                          module.id === selectedModule.id
                            ? { ...module, content: e.target.value }
                            : module
                        );
                        setModules(updated);
                        setSelectedModule({ ...selectedModule, content: e.target.value });
                      }}
                      rows={8}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Duration (minutes)</label>
                    <Input
                      type="number"
                      value={selectedModule.duration}
                      onChange={(e) => {
                        const updated = modules.map(module =>
                          module.id === selectedModule.id
                            ? { ...module, duration: parseInt(e.target.value) || 30 }
                            : module
                        );
                        setModules(updated);
                        setSelectedModule({ ...selectedModule, duration: parseInt(e.target.value) || 30 });
                      }}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Select a module to edit its content</p>
            </div>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Course Structure Progress</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-blue-700">
              {sections.length} sections configured
            </span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-700">
              {modules.length} modules created
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-blue-700">
              {sections.filter(s => s.exam?.isEnabled).length} exams configured
            </span>
          </div>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          Tip: Configure sections → add modules → set up exams → complete course structure
        </p>
      </div>
    </div>
  );
}
