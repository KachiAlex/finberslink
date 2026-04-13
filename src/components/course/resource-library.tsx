"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PDFViewer } from "@/components/ui/pdf-viewer";
import { getCourseResources } from "@/features/lms/data/course-service";
import { SafeImage } from "@/components/ui/safe-image";
import { 
  Search, 
  Download, 
  FileText, 
  Video, 
  Image as ImageIcon,
  Filter,
  Grid3x3,
  List,
  Eye,
  Calendar
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ResourceItem {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'image' | 'document' | 'other';
  url: string;
  size?: number;
  uploadedAt: string;
  description?: string;
  courseId: string;
}

interface ResourceLibraryProps {
  resources: ResourceItem[];
  courseId: string;
  className?: string;
}

export function ResourceLibrary({ resources, courseId, className = "" }: ResourceLibraryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);

  // Filter resources
  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (resource.description && resource.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === "all" || resource.type === selectedType;
    return matchesSearch && matchesType;
  });

  // Get unique types for filter
  const resourceTypes = Array.from(new Set(resources.map(r => r.type)));

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'image': return <ImageIcon className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pdf': return 'bg-red-100 text-red-800 border-red-200';
      case 'video': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'image': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const p = Math.pow(1024, i);
    const s = Math.round(bytes / p * 100) / 100;
    return `${s} ${sizes[i]}`;
  };

  const handleDownload = (resource: ResourceItem) => {
    const link = document.createElement('a');
    link.href = resource.url;
    link.download = resource.title;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewResource = (resource: ResourceItem) => {
    if (resource.type === 'pdf') {
      setSelectedResource(resource);
    } else if (resource.type === 'video') {
      window.open(resource.url, '_blank');
    } else {
      window.open(resource.url, '_blank');
    }
  };

  const ResourceCard = ({ resource }: { resource: ResourceItem }) => (
    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Resource Icon/Preview */}
          <div className="flex-shrink-0 w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
            {resource.type === 'image' ? (
              <SafeImage
                src={resource.url}
                alt={resource.title}
                className="w-full h-full object-cover rounded-lg"
                width={64}
                height={64}
                fallback="/file.svg"
              />
            ) : (
              <div className="text-slate-600">
                {getFileIcon(resource.type)}
              </div>
            )}
          </div>

          {/* Resource Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getTypeColor(resource.type)}>
                {resource.type.toUpperCase()}
              </Badge>
              {resource.size && (
                <span className="text-xs text-slate-500">{formatFileSize(resource.size)}</span>
              )}
            </div>
            
            <h3 className="text-sm font-semibold text-slate-900 mb-1 line-clamp-2">
              {resource.title}
            </h3>
            
            {resource.description && (
              <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                {resource.description}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <Calendar className="h-3 w-3" />
              <span>{new Date(resource.uploadedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => handleViewResource(resource)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
            <Button
              onClick={() => handleDownload(resource)}
              size="sm"
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <FileText className="h-5 w-5" />
            Course Resources ({resources.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              {/* Type Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-slate-200 rounded-md text-sm appearance-none"
                >
                  <option value="all">All Types</option>
                  {resourceTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex border border-slate-200 rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    console.log("Setting view mode to grid");
                    setViewMode("grid");
                  }}
                  className="rounded-r-none"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    console.log("Setting view mode to list");
                    setViewMode("list");
                  }}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-slate-600">
            Showing {filteredResources.length} of {resources.length} resources
          </div>
        </CardContent>
      </Card>

      {/* Resources Grid/List */}
      {filteredResources.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No resources found</h3>
            <p className="text-sm text-slate-600">
              {searchTerm ? "Try adjusting your search terms" : "No resources have been uploaded to this course yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div 
          className={viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
            : "space-y-4"
          }
          onClick={() => console.log("Container clicked, viewMode:", viewMode)}
        >
          {filteredResources.map(resource => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}

      {/* PDF Modal */}
      {selectedResource && selectedResource.type === 'pdf' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-hidden mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{selectedResource.title}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedResource(null)}
              >
                ×
              </Button>
            </div>
            
            <div className="max-h-[70vh] overflow-auto">
              <PDFViewer
                url={selectedResource.url}
                title={selectedResource.title}
                width={900}
                height={600}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
