"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SafeImage } from "@/components/ui/safe-image";
import { 
  X, 
  Save, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Plus, 
  Trash,
  Upload,
  BookOpen,
  Layers3,
  FileText,
  Users,
  Target,
  Video,
  Image as ImageIcon,
  Link as LinkIcon
} from "lucide-react";
import type { CourseApprovalStatus, CourseLevel, LessonFormat, ResourceType } from "@prisma/client";

// Types
interface Course {
  id: string;
  title: string;
  description: string | null;
  tagline: string | null;
  category: string;
  level: CourseLevel;
  coverImage: string | null;
  instructorId: string;
  instructor: {
    firstName: string;
    lastName: string;
    email: string;
  };
  approvalStatus: CourseApprovalStatus;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  outcomes?: string[];
  skills?: string[];
  lessons?: Lesson[];
  resources?: Resource[];
}

interface Lesson {
  id: string;
  title: string;
  durationMinutes: number;
  format: LessonFormat;
  summary?: string;
  content?: string;
  videoUrl?: string;
  resources?: Resource[];
  order: number;
}

interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  url: string;
}

interface CourseEditModalEnhancedProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCourse: Partial<Course>) => void;
}

const CATEGORIES = [
  "BUSINESS", "TECHNOLOGY", "DESIGN", "MARKETING", 
  "HEALTH", "EDUCATION", "FINANCE", "OTHER"
];

const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;

const LESSON_FORMATS = ["VIDEO", "READING", "QUIZ", "ASSIGNMENT", "PROJECT"] as const;

const RESOURCE_TYPES = ["PDF", "VIDEO", "IMAGE", "DOCUMENT", "LINK"] as const;

const STEPS = [
  { id: 0, title: "Basic Info", icon: "BookOpen" },
  { id: 1, title: "Curriculum", icon: "Layers3" },
  { id: 2, title: "Resources", icon: "FileText" },
  { id: 3, title: "Settings", icon: "Users" },
  { id: 4, title: "Review", icon: "CheckCircle2" },
];

const ICONS = {
  BookOpen,
  Layers3,
  FileText,
  Users,
  CheckCircle2,
};

export function CourseEditModalEnhanced({ course, isOpen, onClose, onSave }: CourseEditModalEnhancedProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state - simplified like course creation
  const [basics, setBasics] = useState({
    title: course.title || "",
    tagline: course.tagline || "",
    description: course.description || "",
    category: course.category || CATEGORIES[0], // Default to first category
    level: course.level || "BEGINNER",
    coverImage: course.coverImage || "",
  });
  
  const [outcomesInput, setOutcomesInput] = useState(course.outcomes?.join("\n") || "");
  const [skillsInput, setSkillsInput] = useState(course.skills?.join("\n") || "");
  const [lessons, setLessons] = useState<Lesson[]>(course.lessons || []);
  const [resources, setResources] = useState<Resource[]>(course.resources || []);
  const [approvalStatus, setApprovalStatus] = useState<CourseApprovalStatus>(course.approvalStatus || "DRAFT");
  const [coverPreview, setCoverPreview] = useState(course.coverImage || "");
  const [coverName, setCoverName] = useState<string | null>(null);

  // Update form data when course changes
  useEffect(() => {
    setBasics({
      title: course.title || "",
      tagline: course.tagline || "",
      description: course.description || "",
      category: course.category || CATEGORIES[0], // Default to first category
      level: course.level || "BEGINNER",
      coverImage: course.coverImage || "",
    });
    setOutcomesInput(course.outcomes?.join("\n") || "");
    setSkillsInput(course.skills?.join("\n") || "");
    setLessons(course.lessons || []);
    setResources(course.resources || []);
    setApprovalStatus(course.approvalStatus || "DRAFT");
    setCoverPreview(course.coverImage || "");
    setCoverName(null);
  }, [course]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Validate required fields
      const errors = [];
      
      if (!basics.title.trim()) {
        errors.push('Course title is required');
      }
      if (!basics.category) {
        errors.push('Category is required');
      }
      if (!basics.level) {
        errors.push('Level is required');
      }
      if (!basics.description.trim()) {
        errors.push('Course description is required');
      }
      
      if (errors.length > 0) {
        toast({
          title: "Validation Error",
          description: errors.join(', '),
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      const updatedCourse = {
        ...basics,
        outcomes: outcomesInput.split("\n").filter(Boolean),
        skills: skillsInput.split("\n").filter(Boolean),
        lessons,
        resources,
        approvalStatus,
        // Ensure we have the course ID
        id: course.id,
      };
      
      console.log('Saving course:', updatedCourse);
      const result = await onSave(updatedCourse);
      
      // Only show success if save actually succeeded
      if (result) {
        toast({
          title: "Course Updated",
          description: "Course has been successfully updated.",
        });
        onClose();
      }
    } catch (error) {
      console.error('Save error:', error);
      // Don't show success toast on error
      toast({
        title: "Error",
        description: "Failed to update course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
        setCoverName(file.name);
        setBasics(prev => ({ ...prev, coverImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addLesson = () => {
    const newLesson: Lesson = {
      id: Date.now().toString(),
      title: "",
      durationMinutes: 60,
      format: "VIDEO",
      summary: "",
      content: "",
      videoUrl: "",
      resources: [],
      order: lessons.length,
    };
    setLessons(prev => [...prev, newLesson]);
  };

  const updateLesson = (index: number, updates: Partial<Lesson>) => {
    setLessons(prev => prev.map((lesson, i) => 
      i === index ? { ...lesson, ...updates } : lesson
    ));
  };

  const removeLesson = (index: number) => {
    setLessons(prev => prev.filter((_, i) => i !== index));
  };

  const addResource = () => {
    const newResource: Resource = {
      id: Date.now().toString(),
      title: "",
      type: "PDF",
      url: "",
    };
    setResources(prev => [...prev, newResource]);
  };

  const updateResource = (index: number, updates: Partial<Resource>) => {
    setResources(prev => prev.map((resource, i) => 
      i === index ? { ...resource, ...updates } : resource
    ));
  };

  const removeResource = (index: number) => {
    setResources(prev => prev.filter((_, i) => i !== index));
  };

  const handleResourceFileUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For now, create a simple URL. In production, you'd upload to a server
      const fileUrl = URL.createObjectURL(file);
      updateResource(index, { 
        url: fileUrl,
        title: file.name
      });
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-50 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4 bg-white rounded-lg shadow-xl text-black">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-black">Edit Course</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 text-black hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-black">Step {currentStep + 1} of {STEPS.length}</span>
              <span className="text-black">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between">
              {STEPS.map((step, index) => {
                const IconComponent = ICONS[step.icon as keyof typeof ICONS];
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm
                      ${isCompleted ? 'bg-emerald-600 text-white' : 
                        isCurrent ? 'bg-blue-600 text-white' : 
                        'bg-slate-200 text-black'}
                    `}>
                      {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : 
                       IconComponent ? <IconComponent className="h-4 w-4" /> : 
                       <div className="w-4 h-4 bg-slate-400 rounded-full" />}
                    </div>
                    <span className="text-xs text-black mt-1">{step.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 text-black">
          {currentStep === 0 && (
            <BasicInfoStep 
              basics={basics} 
              setBasics={setBasics}
              outcomesInput={outcomesInput}
              setOutcomesInput={setOutcomesInput}
              skillsInput={skillsInput}
              setSkillsInput={setSkillsInput}
              coverPreview={coverPreview}
              coverName={coverName}
              onCoverImageChange={handleCoverImageChange}
            />
          )}
          {currentStep === 1 && (
            <CurriculumStep 
              lessons={lessons} 
              addLesson={addLesson}
              updateLesson={updateLesson}
              removeLesson={removeLesson}
            />
          )}
          {currentStep === 2 && (
            <ResourcesStep 
              resources={resources} 
              addResource={addResource}
              updateResource={updateResource}
              removeResource={removeResource}
              handleResourceFileUpload={handleResourceFileUpload}
            />
          )}
          {currentStep === 3 && (
            <SettingsStep 
              approvalStatus={approvalStatus}
              setApprovalStatus={setApprovalStatus}
            />
          )}
          {currentStep === 4 && (
            <ReviewStep 
              basics={basics}
              outcomesInput={outcomesInput}
              skillsInput={skillsInput}
              lessons={lessons}
              resources={resources}
              approvalStatus={approvalStatus}
              coverPreview={coverPreview}
              course={course}
            />
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 z-10 text-black">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isSaving}
                  className="text-black border-black hover:bg-gray-100"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              {currentStep < STEPS.length - 1 ? (
                <Button onClick={handleNext} className="bg-black text-white hover:bg-gray-800">
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSave} disabled={isSaving} className="bg-black text-white hover:bg-gray-800">
                  {isSaving ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simplified Step Components
function BasicInfoStep({ 
  basics, 
  setBasics, 
  outcomesInput, 
  setOutcomesInput, 
  skillsInput, 
  setSkillsInput, 
  coverPreview, 
  coverName, 
  onCoverImageChange 
}: any) {
  return (
    <div className="space-y-6 text-black">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-black font-medium">Course Title *</Label>
            <Input
              id="title"
              value={basics.title}
              onChange={(e) => setBasics(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter course title"
              className="mt-1 text-black"
            />
          </div>

          <div>
            <Label htmlFor="tagline" className="text-black font-medium">Tagline</Label>
            <Input
              id="tagline"
              value={basics.tagline}
              onChange={(e) => setBasics(prev => ({ ...prev, tagline: e.target.value }))}
              placeholder="Short course description"
              className="mt-1 text-black"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-black font-medium">Course Description *</Label>
            <Textarea
              id="description"
              value={basics.description}
              onChange={(e) => setBasics(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed course description"
              rows={4}
              className="mt-1 text-black"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category" className="text-black font-medium">Category *</Label>
              <select
                id="category"
                value={basics.category}
                onChange={(e) => setBasics(prev => ({ ...prev, category: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="level" className="text-black font-medium">Level *</Label>
              <select
                id="level"
                value={basics.level}
                onChange={(e) => setBasics(prev => ({ ...prev, level: e.target.value as CourseLevel }))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select level</option>
                {LEVELS.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div>
            <Label className="text-black font-medium">Course Cover Image</Label>
            <div className="mt-1">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                {coverPreview ? (
                  <div className="space-y-2">
                    <SafeImage
                      src={coverPreview}
                      alt="Course cover"
                      className="w-full h-48 object-cover rounded"
                      fallback="/placeholder-course.jpg"
                    />
                    <p className="text-sm text-black">{coverName}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 text-slate-400 mx-auto" />
                    <p className="text-sm text-black">Click to upload cover image</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={onCoverImageChange}
                  className="hidden"
                  id="cover-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('cover-upload')?.click()}
                  className="mt-2 text-black border-black hover:bg-gray-100"
                >
                  {coverPreview ? "Change Image" : "Upload Image"}
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="outcomes" className="text-black font-medium">Learning Outcomes</Label>
            <Textarea
              id="outcomes"
              value={outcomesInput}
              onChange={(e) => setOutcomesInput(e.target.value)}
              placeholder="Enter each learning outcome on a new line"
              rows={3}
              className="mt-1 text-black"
            />
            <p className="text-xs text-black mt-1">One outcome per line</p>
          </div>

          <div>
            <Label htmlFor="skills" className="text-black font-medium">Skills Gained</Label>
            <Textarea
              id="skills"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="Enter each skill on a new line"
              rows={3}
              className="mt-1 text-black"
            />
            <p className="text-xs text-black mt-1">One skill per line</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CurriculumStep({ lessons, addLesson, updateLesson, removeLesson }: any) {
  return (
    <div className="space-y-6 text-black">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-black">Course Curriculum</h3>
        <Button onClick={addLesson} className="bg-black text-white hover:bg-gray-800">
          <Plus className="h-4 w-4 mr-2" />
          Add Lesson
        </Button>
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-slate-300 rounded-lg">
          <Layers3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-black">No lessons added yet</p>
          <Button onClick={addLesson} className="mt-4 bg-black text-white hover:bg-gray-800">
            Add Your First Lesson
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson: Lesson, index: number) => (
            <Card key={lesson.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-black">Lesson {index + 1}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLesson(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`lesson-title-${index}`} className="text-black font-medium">Lesson Title</Label>
                    <Input
                      id={`lesson-title-${index}`}
                      value={lesson.title}
                      onChange={(e) => updateLesson(index, { title: e.target.value })}
                      placeholder="Enter lesson title"
                      className="mt-1 text-black"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor={`lesson-duration-${index}`} className="text-black font-medium">Duration (min)</Label>
                      <Input
                        id={`lesson-duration-${index}`}
                        type="number"
                        value={lesson.durationMinutes}
                        onChange={(e) => updateLesson(index, { durationMinutes: parseInt(e.target.value) || 0 })}
                        placeholder="60"
                        className="mt-1 text-black"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`lesson-format-${index}`} className="text-black font-medium">Format</Label>
                      <select
                        id={`lesson-format-${index}`}
                        value={lesson.format}
                        onChange={(e) => updateLesson(index, { format: e.target.value as LessonFormat })}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {LESSON_FORMATS.map(format => (
                          <option key={format} value={format}>{format}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor={`lesson-summary-${index}`} className="text-black font-medium">Summary</Label>
                  <Textarea
                    id={`lesson-summary-${index}`}
                    value={lesson.summary || ""}
                    onChange={(e) => updateLesson(index, { summary: e.target.value })}
                    placeholder="Brief lesson summary"
                    rows={2}
                    className="mt-1 text-black"
                  />
                </div>

                {lesson.format === "VIDEO" && (
                  <div>
                    <Label htmlFor={`lesson-video-${index}`} className="text-black font-medium">Video URL</Label>
                    <Input
                      id={`lesson-video-${index}`}
                      value={lesson.videoUrl || ""}
                      onChange={(e) => updateLesson(index, { videoUrl: e.target.value })}
                      placeholder="https://youtube.com/watch?v=..."
                      className="mt-1 text-black"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor={`lesson-content-${index}`} className="text-black font-medium">Content</Label>
                  <Textarea
                    id={`lesson-content-${index}`}
                    value={lesson.content || ""}
                    onChange={(e) => updateLesson(index, { content: e.target.value })}
                    placeholder="Lesson content or instructions"
                    rows={3}
                    className="mt-1 text-black"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ResourcesStep({ resources, addResource, updateResource, removeResource, handleResourceFileUpload }: any) {
  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case "PDF": return <FileText className="h-4 w-4" />;
      case "VIDEO": return <Video className="h-4 w-4" />;
      case "IMAGE": return <ImageIcon className="h-4 w-4" />;
      case "LINK": return <LinkIcon className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 text-black">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-black">Course Resources</h3>
        <Button onClick={addResource} className="bg-black text-white hover:bg-gray-800">
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {resources.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-slate-300 rounded-lg">
          <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-black">No resources added yet</p>
          <Button onClick={addResource} className="mt-4 bg-black text-white hover:bg-gray-800">
            Add Your First Resource
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {resources.map((resource: Resource, index: number) => (
            <Card key={resource.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      {getResourceIcon(resource.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`resource-title-${index}`} className="text-black font-medium">Title</Label>
                        <Input
                          id={`resource-title-${index}`}
                          value={resource.title}
                          onChange={(e) => updateResource(index, { title: e.target.value })}
                          placeholder="Resource title"
                          className="mt-1 text-black"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`resource-type-${index}`} className="text-black font-medium">Type</Label>
                        <select
                          id={`resource-type-${index}`}
                          value={resource.type}
                          onChange={(e) => updateResource(index, { type: e.target.value as ResourceType })}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {RESOURCE_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label htmlFor={`resource-url-${index}`} className="text-black font-medium">URL</Label>
                        <div className="flex gap-2">
                          <Input
                            id={`resource-url-${index}`}
                            value={resource.url}
                            onChange={(e) => updateResource(index, { url: e.target.value })}
                            placeholder="https://..."
                            className="mt-1 text-black flex-1"
                          />
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mov"
                            onChange={(e) => handleResourceFileUpload(index, e)}
                            className="hidden"
                            id={`resource-file-${index}`}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById(`resource-file-${index}`)?.click()}
                            className="mt-1 text-black border-black hover:bg-gray-100"
                          >
                            Upload
                          </Button>
                        </div>
                        {resource.title && (
                          <p className="text-xs text-green-600 mt-1">
                            📎 {resource.title}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeResource(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsStep({ approvalStatus, setApprovalStatus }: any) {
  return (
    <div className="space-y-6 text-black">
      <h3 className="text-lg font-semibold text-black">Course Settings</h3>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-black">Publication Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="approval-status" className="text-black font-medium">Status</Label>
            <select
              id="approval-status"
              value={approvalStatus}
              onChange={(e) => setApprovalStatus(e.target.value as CourseApprovalStatus)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="DRAFT">Draft</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="CHANGES">Needs Changes</option>
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="certificate-enabled"
                defaultChecked={true}
                className="rounded"
              />
              <Label htmlFor="certificate-enabled" className="text-black">Certificate available</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="self-enrollment"
                defaultChecked={true}
                className="rounded"
              />
              <Label htmlFor="self-enrollment" className="text-black">Allow self-enrollment</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="public-course"
                defaultChecked={true}
                className="rounded"
              />
              <Label htmlFor="public-course" className="text-black">Public course</Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewStep({ 
  basics, 
  outcomesInput, 
  skillsInput, 
  lessons, 
  resources, 
  approvalStatus, 
  coverPreview, 
  course 
}: any) {
  const outcomes = outcomesInput.split("\n").filter(Boolean);
  const skills = skillsInput.split("\n").filter(Boolean);

  return (
    <div className="space-y-6 text-black">
      <h3 className="text-lg font-semibold text-black">Review Course Changes</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-black">Course Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-black">Title</Label>
              <p className="text-black">{basics.title || "Not set"}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-black">Tagline</Label>
              <p className="text-black">{basics.tagline || "Not set"}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-black">Category & Level</Label>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="text-black border-black">{basics.category}</Badge>
                <Badge variant="outline" className="text-black border-black">{basics.level}</Badge>
              </div>
            </div>

            {coverPreview && (
              <div>
                <Label className="text-sm font-medium text-black">Cover Image</Label>
                <SafeImage
                  src={coverPreview}
                  alt="Course cover"
                  className="w-full h-32 object-cover rounded mt-1"
                  fallback="/placeholder-course.jpg"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Course Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-black">Course Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-black">Lessons</Label>
              <p className="text-black">{lessons.length} lessons</p>
              {lessons.length > 0 && (
                <ul className="text-sm text-black mt-1 space-y-1">
                  {lessons.slice(0, 3).map((lesson: Lesson, index: number) => (
                    <li key={lesson.id}>Lesson {index + 1}: {lesson.title || "Untitled"}</li>
                  ))}
                  {lessons.length > 3 && (
                    <li className="text-slate-500">...and {lessons.length - 3} more</li>
                  )}
                </ul>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium text-black">Resources</Label>
              <p className="text-black">{resources.length} resources</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-black">Status</Label>
              <Badge variant="outline" className="text-black border-black">{approvalStatus}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Learning Outcomes */}
        {outcomes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-black">Learning Outcomes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {outcomes.map((outcome: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-black">{outcome}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-black">Skills Gained</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-black">{skill}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Ready to Save</h4>
            <p className="text-sm text-blue-700 mt-1">
              Review all the changes above and click "Save Changes" to update the course.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
