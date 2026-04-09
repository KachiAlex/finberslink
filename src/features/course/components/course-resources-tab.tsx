"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Video, Image, ExternalLink, Search } from "lucide-react";

interface CourseResourcesTabProps {
  resources: any[];
  courseId: string;
}

export function CourseResourcesTab({ resources, courseId }: CourseResourcesTabProps) {
  // Add sample resources if none exist
  const allResources = resources.length > 0 ? resources : [
    {
      id: 'sample-1',
      title: 'Course Guide PDF',
      type: 'pdf',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      uploadedAt: new Date().toISOString(),
      size: '2.4 MB',
      description: 'Comprehensive guide covering all course concepts and best practices.'
    },
    {
      id: 'sample-2',
      title: 'Introduction Video',
      type: 'video',
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&showinfo=0&modestbranding=1',
      uploadedAt: new Date().toISOString(),
      size: '15 min',
      description: 'Welcome video explaining course structure and learning objectives.'
    },
    {
      id: 'sample-3',
      title: 'Course Diagrams',
      type: 'image',
      url: 'https://picsum.photos/400/300',
      uploadedAt: new Date().toISOString(),
      size: '1.2 MB',
      description: 'Visual diagrams and charts to help understand complex concepts.'
    },
    {
      id: 'sample-4',
      title: 'Code Examples',
      type: 'link',
      url: 'https://github.com/example/course-code',
      uploadedAt: new Date().toISOString(),
      size: 'Repository',
      description: 'GitHub repository with all code examples and exercises.'
    }
  ];

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'video':
        return <Video className="w-5 h-5 text-blue-500" />;
      case 'image':
        return <Image className="w-5 h-5 text-green-500" />;
      case 'link':
        return <ExternalLink className="w-5 h-5 text-purple-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      pdf: 'bg-red-100 text-red-700 border-red-200',
      video: 'bg-blue-100 text-blue-700 border-blue-200',
      image: 'bg-green-100 text-green-700 border-green-200',
      link: 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const groupedResources = allResources.reduce((acc, resource) => {
    if (!acc[resource.type]) {
      acc[resource.type] = [];
    }
    acc[resource.type].push(resource);
    return acc;
  }, {} as Record<string, Array<typeof allResources[0]>>);

  return (
    <div className="space-y-6">
      {/* Resources Header */}
      <Card className="border-gray-200 bg-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Course Resources</h2>
              <p className="text-gray-600 mt-1">
                Downloadable materials and references to support your learning
              </p>
            </div>
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
              {allResources.length} Resources
            </Badge>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search resources..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </CardContent>
      </Card>

      {/* Resources by Type */}
      {Object.entries(groupedResources).map(([type, typeResources]) => {
        const resources = typeResources as Array<typeof allResources[0]>;
        return (
          <Card key={type} className="border-gray-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              {getResourceIcon(type)}
              <h3 className="text-xl font-bold text-gray-900 capitalize">
                {type === 'pdf' ? 'PDF Documents' : 
                 type === 'video' ? 'Video Resources' :
                 type === 'image' ? 'Images & Graphics' :
                 type === 'link' ? 'External Links' : 
                 type.charAt(0).toUpperCase() + type.slice(1) + 's'}
              </h3>
              <Badge className={getTypeBadge(type)}>
                {resources.length}
              </Badge>
            </div>

            <div className="space-y-3">
              {resources.map((resource) => (
                <div key={resource.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                      {getResourceIcon(resource.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{resource.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                        <span>{resource.size || 'Unknown size'}</span>
                        <span>·</span>
                        <span>{new Date(resource.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" asChild>
                      <a 
                        href={resource.url} 
                        target={resource.type === 'link' ? '_blank' : '_self'}
                        rel={resource.type === 'link' ? 'noopener noreferrer' : undefined}
                        className="flex items-center gap-2"
                      >
                        {resource.type === 'link' ? (
                          <>
                            <ExternalLink className="w-4 h-4" />
                            Open
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Download
                          </>
                        )}
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        );
      })}

      {/* Additional Resources */}
      <Card className="border-gray-200 bg-white">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Additional Learning Materials</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border border-gray-200 rounded-lg">
              <FileText className="w-8 h-8 text-blue-500 mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Recommended Reading</h4>
              <p className="text-sm text-gray-600 mb-3">
                Curated list of books and articles to deepen your understanding
              </p>
              <Button variant="outline" size="sm" className="border-gray-300 text-gray-700">
                View Reading List
              </Button>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <Video className="w-8 h-8 text-blue-500 mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Supplementary Videos</h4>
              <p className="text-sm text-gray-600 mb-3">
                Additional video content for complex topics
              </p>
              <Button variant="outline" size="sm" className="border-gray-300 text-gray-700">
                Watch Videos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
