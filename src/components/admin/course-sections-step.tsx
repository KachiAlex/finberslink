"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash, Layers3, BookOpen } from "lucide-react";

interface SectionsStepProps {
  sections: any[];
  setSections: (sections: any[]) => void;
  modules: any[];
  setModules: (modules: any[]) => void;
}

export function SectionsStep({ sections, setSections, modules, setModules }: SectionsStepProps) {
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newModuleTitle, setNewModuleTitle] = useState('');

  const addSection = () => {
    if (newSectionTitle.trim()) {
      const newSection = {
        id: `section_${Date.now()}`,
        title: newSectionTitle,
        lessons: [],
        order: sections.length
      };
      setSections([...sections, newSection]);
      setNewSectionTitle('');
    }
  };

  const addModule = () => {
    if (newModuleTitle.trim()) {
      const newModule = {
        id: `module_${Date.now()}`,
        title: newModuleTitle,
        sections: [],
        order: modules.length
      };
      setModules([...modules, newModule]);
      setNewModuleTitle('');
    }
  };

  const removeSection = (index: number) => {
    const newSections = sections.filter((_, i) => i !== index);
    setSections(newSections);
  };

  const removeModule = (index: number) => {
    const newModules = modules.filter((_, i) => i !== index);
    setModules(newModules);
  };

  return (
    <div className="space-y-6 text-black">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
          <Layers3 className="h-5 w-5 text-blue-600" />
          Course Sections
        </h3>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              placeholder="New section title"
              className="flex-1"
            />
            <Button onClick={addSection} className="bg-blue-600 text-white hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>
          
          {sections.map((section: any, index: number) => (
            <Card key={section.id} className="bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-black">{section.title}</h4>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeSection(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  <BookOpen className="h-4 w-4 inline mr-1" />
                  {section.lessons?.length || 0} lessons
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
          <Layers3 className="h-5 w-5 text-green-600" />
          Course Modules
        </h3>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              placeholder="New module title"
              className="flex-1"
            />
            <Button onClick={addModule} className="bg-green-600 text-white hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Module
            </Button>
          </div>
          
          {modules.map((module: any, index: number) => (
            <Card key={module.id} className="bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-black">{module.title}</h4>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeModule(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  <Layers3 className="h-4 w-4 inline mr-1" />
                  {module.sections?.length || 0} sections
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
