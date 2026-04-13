"use client";

import { useState, useEffect } from "react";
import { 
  Filter, 
  DollarSign, 
  Briefcase, 
  Building, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  GraduationCap,
  Heart,
  ChevronDown,
  ChevronUp,
  X,
  SlidersHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  JobFilters, 
  getSalaryRangeFilters, 
  getIndustries, 
  getBenefits, 
  getCompanySizes, 
  getExperienceLevels 
} from "@/features/jobs/service";

interface AdvancedJobFiltersProps {
  currentFilters: JobFilters;
  availableTags: Array<{ tag: string; count: number }>;
  popularCompanies: Array<{ name: string; jobCount: number }>;
  onFiltersChange: (filters: JobFilters) => void;
  className?: string;
}

export function AdvancedJobFilters({
  currentFilters,
  availableTags,
  popularCompanies,
  onFiltersChange,
  className
}: AdvancedJobFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    salary: true,
    experience: false,
    company: false,
    benefits: false,
    postedDate: false,
    education: false
  });

  const [salaryRange, setSalaryRange] = useState<[number, number]>([
    currentFilters.minSalary || 0,
    currentFilters.maxSalary || 200000
  ]);

  const salaryRanges = getSalaryRangeFilters();
  const industries = getIndustries();
  const benefits = getBenefits();
  const companySizes = getCompanySizes();
  const experienceLevels = getExperienceLevels();

  const postedWithinOptions = [
    { value: '24H', label: 'Last 24 hours' },
    { value: '3D', label: 'Last 3 days' },
    { value: '1W', label: 'Last week' },
    { value: '1M', label: 'Last month' }
  ];

  const educationLevels = [
    { value: 'HIGH_SCHOOL', label: 'High School' },
    { value: 'ASSOCIATE', label: 'Associate Degree' },
    { value: 'BACHELOR', label: 'Bachelor\'s Degree' },
    { value: 'MASTER', label: 'Master\'s Degree' },
    { value: 'PHD', label: 'PhD' }
  ];

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFiltersChange({
        ...currentFilters,
        minSalary: salaryRange[0] > 0 ? salaryRange[0] : undefined,
        maxSalary: salaryRange[1] < 200000 ? salaryRange[1] : undefined
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [salaryRange]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: currentFilters.search,
      location: currentFilters.location,
      jobType: currentFilters.jobType,
      remoteOption: currentFilters.remoteOption,
      company: currentFilters.company,
      tags: currentFilters.tags,
      featured: currentFilters.featured,
      page: 1,
      limit: currentFilters.limit
    });
    setSalaryRange([0, 200000]);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (currentFilters.minSalary || currentFilters.maxSalary) count++;
    if (currentFilters.experienceLevel) count++;
    if (currentFilters.companySize) count++;
    if (currentFilters.industry?.length) count++;
    if (currentFilters.benefits?.length) count++;
    if (currentFilters.postedWithin) count++;
    if (currentFilters.educationLevel) count++;
    return count;
  };

  const FilterSection = ({ 
    title, 
    icon: Icon, 
    section, 
    children, 
    defaultExpanded = false 
  }: { 
    title: string; 
    icon: any; 
    section: string; 
    children: React.ReactNode; 
    defaultExpanded?: boolean;
  }) => (
    <Collapsible 
      open={expandedSections[section] ?? defaultExpanded}
      onOpenChange={() => toggleSection(section)}
    >
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full justify-between p-3 h-auto hover:bg-slate-700/50"
        >
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-cyan-400" />
            <span className="font-medium text-white">{title}</span>
          </div>
          {expandedSections[section] ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );

  return (
    <Card className={`border-slate-700/50 bg-slate-800/50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
            Advanced Filters
          </CardTitle>
          <div className="flex items-center gap-2">
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="bg-cyan-600/20 text-cyan-300 border-cyan-600/30">
                {getActiveFiltersCount()} active
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllFilters}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Salary Range Filter */}
        <FilterSection title="Salary Range" icon={DollarSign} section="salary">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>${(salaryRange[0] / 1000).toFixed(0)}k</span>
              <span>${(salaryRange[1] / 1000).toFixed(0)}k</span>
            </div>
            <Slider
              value={salaryRange}
              onValueChange={setSalaryRange}
              max={200000}
              step={5000}
              className="w-full"
            />
            <div className="grid grid-cols-2 gap-2">
              {salaryRanges.slice(0, 6).map((range) => (
                <Button
                  key={range.label}
                  variant="outline"
                  size="sm"
                  onClick={() => setSalaryRange([range.min, range.max])}
                  className={`text-xs ${
                    salaryRange[0] === range.min && salaryRange[1] === range.max
                      ? 'bg-cyan-600 border-cyan-500'
                      : 'border-slate-600 text-slate-300'
                  }`}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>
        </FilterSection>

        {/* Experience Level Filter */}
        <FilterSection title="Experience Level" icon={Briefcase} section="experience">
          <div className="space-y-2">
            {experienceLevels.map((level) => (
              <div key={level.value} className="flex items-center space-x-2">
                <Checkbox
                  id={level.value}
                  checked={currentFilters.experienceLevel === level.value}
                  onCheckedChange={(checked) => {
                    onFiltersChange({
                      ...currentFilters,
                      experienceLevel: checked ? level.value as any : undefined
                    });
                  }}
                />
                <Label 
                  htmlFor={level.value} 
                  className="text-sm text-slate-300 cursor      <div className="font-medium">{level.label}</div>
                    <div className="text-xs text-slate-500">{level.years}</div>
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </FilterSection>

        {/* Company Size Filter */}
        <FilterSection title="Company Size" icon={Building} section="company">
          <div className="space-y-2">
            {companySizes.map((size) => (
              <div key={size.value} className="flex items-center space-x-2">
                <Checkbox
                  id={size.value}
                  checked={currentFilters.companySize === size.value}
                  onCheckedChange={(checked) => {
                    onFiltersChange({
                      ...currentFilters,
                      companySize: checked ? size.value as any : undefined
                    });
                  }}
                />
                <Label 
                  htmlFor={size.value} 
                  className="text-sm text-slate-300 cursor-pointer"
                >
                  <div>
                    <div className="font-medium">{size.label}</div>
                    <div className="text-xs text-slate-500">{size.description}</div>
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </FilterSection>

        {/* Industry Filter */}
        <FilterSection title="Industry" icon={Users} section="industry">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {industries.map((industry) => (
              <div key={industry.value} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={industry.value}
                    checked={currentFilters.industry?.includes(industry.value)}
                    onCheckedChange={(checked) => {
                      const currentIndustries = currentFilters.industry || [];
                      const newIndustries = checked
                        ? [...currentIndustries, industry.value]
                        : currentIndustries.filter(i => i !== industry.value);
                      
                      onFiltersChange({
                        ...currentFilters,
                        industry: newIndustries.length > 0 ? newIndustries : undefined
                      });
                    }}
                  />
                  <Label 
                    htmlFor={industry.value} 
                    className="text-sm text-slate-300 cursor-pointer"
                  >
                    {industry.label}
                  </Label>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {industry.count}
                </Badge>
              </div>
            ))}
          </div>
        </FilterSection>

        {/* Benefits Filter */}
        <FilterSection title="Benefits" icon={Heart} section="benefits">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {benefits.map((benefit) => (
              <div key={benefit.value} className="flex items-center space-x-2">
                <Checkbox
                  id={benefit.value}
                  checked={currentFilters.benefits?.includes(benefit.value)}
                  onCheckedChange={(checked) => {
                    const currentBenefits = currentFilters.benefits || [];
                    const newBenefits = checked
                      ? [...currentBenefits, benefit.value]
                      : currentBenefits.filter(b => b !== benefit.value);
                    
                    onFiltersChange({
                      ...currentFilters,
                      benefits: newBenefits.length > 0 ? newBenefits : undefined
                    });
                  }}
                />
                <Label 
                  htmlFor={benefit.value} 
                  className="text-sm text-slate-300 cursor-pointer"
                >
                  {benefit.label}
                </Label>
              </div>
            ))}
          </div>
        </FilterSection>

        {/* Posted Date Filter */}
        <FilterSection title="Posted Date" icon={Calendar} section="postedDate">
          <div className="space-y-2">
            {postedWithinOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={option.value}
                  checked={currentFilters.postedWithin === option.value}
                  onCheckedChange={(checked) => {
                    onFiltersChange({
                      ...currentFilters,
                      postedWithin: checked ? option.value as any : undefined
                    });
                  }}
                />
                <Label 
                  htmlFor={option.value} 
                  className="text-sm text-slate-300 cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </FilterSection>

        {/* Education Level Filter */}
        <FilterSection title="Education Level" icon={GraduationCap} section="education">
          <div className="space-y-2">
            {educationLevels.map((level) => (
              <div key={level.value} className="flex items-center space-x-2">
                <Checkbox
                  id={level.value}
                  checked={currentFilters.educationLevel === level.value}
                  onCheckedChange={(checked) => {
                    onFiltersChange({
                      ...currentFilters,
                      educationLevel: checked ? level.value as any : undefined
                    });
                  }}
                />
                <Label 
                  htmlFor={level.value} 
                  className="text-sm text-slate-300 cursor-pointer"
                >
                  {level.label}
                </Label>
              </div>
            ))}
          </div>
        </FilterSection>
      </CardContent>
    </Card>
  );
}
