"use client";

import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { 
  Award, 
  Settings, 
  CheckCircle, 
  Clock, 
  Target, 
  FileText, 
  Users, 
  Calendar,
  Shield,
  Palette
} from "lucide-react";
import type { CourseCertificate, CertificateTemplate } from "./course-edit-modal-enhanced";

interface CertificateConfigurationStepProps {
  certificate: CourseCertificate;
  setCertificate: (certificate: CourseCertificate) => void;
  sections: any[];
}

const defaultTemplates: CertificateTemplate[] = [
  {
    id: 'default',
    name: 'Professional Certificate',
    description: 'Clean and professional design suitable for corporate courses',
    design: {
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      borderColor: '#e5e7eb',
      logoPosition: 'top-left',
      signaturePosition: 'bottom-right'
    },
    fields: {
      courseTitle: true,
      studentName: true,
      completionDate: true,
      instructorName: true,
      certificateId: true
    }
  },
  {
    id: 'modern',
    name: 'Modern Certificate',
    description: 'Contemporary design with bold colors and typography',
    design: {
      backgroundColor: '#f8fafc',
      textColor: '#111827',
      borderColor: '#3b82f6',
      logoPosition: 'top-center',
      signaturePosition: 'bottom-center'
    },
    fields: {
      courseTitle: true,
      studentName: true,
      completionDate: true,
      instructorName: true,
      certificateId: true
    }
  },
  {
    id: 'academic',
    name: 'Academic Certificate',
    description: 'Traditional academic style for educational institutions',
    design: {
      backgroundColor: '#fef3c7',
      textColor: '#92400e',
      borderColor: '#f59e0b',
      logoPosition: 'top-left',
      signaturePosition: 'bottom-left'
    },
    fields: {
      courseTitle: true,
      studentName: true,
      completionDate: true,
      instructorName: true,
      certificateId: true
    }
  }
];

export function CertificateConfigurationStep({ 
  certificate, 
  setCertificate, 
  sections 
}: CertificateConfigurationStepProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate>(
    defaultTemplates.find(t => t.id === certificate.templateId) || defaultTemplates[0]
  );

  const updateCertificate = (updates: Partial<CourseCertificate>) => {
    setCertificate({ ...certificate, ...updates });
  };

  const updateCompletionCriteria = (updates: Partial<CourseCertificate['completionCriteria']>) => {
    setCertificate({
      ...certificate,
      completionCriteria: { ...certificate.completionCriteria, ...updates }
    });
  };

  const updateSettings = (updates: Partial<CourseCertificate['settings']>) => {
    setCertificate({
      ...certificate,
      settings: { ...certificate.settings, ...updates }
    });
  };

  const selectTemplate = (template: CertificateTemplate) => {
    setSelectedTemplate(template);
    updateCertificate({ templateId: template.id });
  };

  const enabledExamsCount = sections.filter(s => s.exam?.isEnabled).length;
  const totalSectionsCount = sections.length;

  return (
    <div className="space-y-6 text-black">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Template Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-600" />
              Certificate Template
            </h3>
            <Badge variant={certificate.isEnabled ? "default" : "secondary"} className="text-xs">
              {certificate.isEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>

          {/* Template Options */}
          <div className="space-y-3">
            {defaultTemplates.map((template) => (
              <Card 
                key={template.id}
                className={`cursor-pointer transition-all ${
                  selectedTemplate.id === template.id
                    ? 'ring-2 ring-purple-500 bg-purple-50'
                    : 'hover:shadow-md hover:bg-gray-50'
                }`}
                onClick={() => selectTemplate(template)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-black">{template.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {template.design.logoPosition}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {template.design.signaturePosition}
                        </Badge>
                      </div>
                    </div>
                    <div className="w-16 h-12 border-2 rounded flex items-center justify-center"
                         style={{ 
                           backgroundColor: template.design.backgroundColor,
                           borderColor: template.design.borderColor,
                           color: template.design.textColor
                         }}>
                      <span className="text-xs font-bold">CERT</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Panel - Certificate Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-black mb-4">
            Certificate Settings
          </h3>
          
          {/* Enable Certificate */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-black flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-600" />
                Certificate Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={certificate.isEnabled}
                    onChange={(e) => updateCertificate({ isEnabled: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-black">Enable Certificate for this Course</span>
                </label>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={certificate.autoGenerate}
                    onChange={(e) => updateCertificate({ autoGenerate: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-black">Auto-generate on Completion</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Completion Criteria */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-black flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-600" />
                Completion Criteria
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minScore" className="block text-sm font-medium text-black mb-2">
                    Minimum Score (%)
                  </Label>
                  <Input
                    id="minScore"
                    type="number"
                    value={certificate.completionCriteria.minimumScore}
                    onChange={(e) => updateCompletionCriteria({ 
                      minimumScore: parseInt(e.target.value) || 70 
                    })}
                    min="0"
                    max="100"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <Label htmlFor="minProgress" className="block text-sm font-medium text-black mb-2">
                    Minimum Progress (%)
                  </Label>
                  <Input
                    id="minProgress"
                    type="number"
                    value={certificate.completionCriteria.minimumProgress}
                    onChange={(e) => updateCompletionCriteria({ 
                      minimumProgress: parseInt(e.target.value) || 100 
                    })}
                    min="0"
                    max="100"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={certificate.completionCriteria.requireAllSections}
                    onChange={(e) => updateCompletionCriteria({ 
                      requireAllSections: e.target.checked 
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-black">Require All Sections</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={certificate.completionCriteria.requireAllExams}
                    onChange={(e) => updateCompletionCriteria({ 
                      requireAllExams: e.target.checked 
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-black">Require All Exams</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Certificate Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-black flex items-center gap-2">
                <Settings className="h-4 w-4 text-purple-600" />
                Certificate Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="validityPeriod" className="block text-sm font-medium text-black mb-2">
                  Validity Period (months)
                </Label>
                <Input
                  id="validityPeriod"
                  type="number"
                  value={certificate.settings.validityPeriod}
                  onChange={(e) => updateSettings({ 
                    validityPeriod: parseInt(e.target.value) || 12 
                  })}
                  min="1"
                  max="60"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={certificate.settings.includeInstructorSignature}
                    onChange={(e) => updateSettings({ 
                      includeInstructorSignature: e.target.checked 
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-black">Include Instructor Signature</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={certificate.settings.includeCertificateId}
                    onChange={(e) => updateSettings({ 
                      includeCertificateId: e.target.checked 
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-black">Include Certificate ID</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-medium text-purple-900 mb-2">Certificate Configuration Summary</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-purple-600" />
            <span className="text-sm text-purple-700">
              Template: {selectedTemplate.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-purple-600" />
            <span className="text-sm text-purple-700">
              Status: {certificate.isEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-600" />
            <span className="text-sm text-purple-700">
              {certificate.completionCriteria.minimumScore}% score required
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-600" />
            <span className="text-sm text-purple-700">
              {certificate.settings.validityPeriod} months validity
            </span>
          </div>
        </div>
        <p className="text-xs text-purple-600 mt-2">
          Tip: Configure certificate templates, completion criteria, and settings for automatic student certification
        </p>
      </div>
    </div>
  );
}
