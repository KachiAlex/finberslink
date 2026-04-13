"use client";

import { useState, useRef, useCallback } from "react";
import { 
  Paperclip, 
  Upload, 
  X, 
  File, 
  Image, 
  Video, 
  Music, 
  Archive,
  FileText,
  Download,
  Eye,
  Share2,
  Grid,
  List,
  Search,
  Filter,
  Star,
  Clock,
  Folder
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { uploadChatFile } from "../service";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  uploadedBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    pages?: number;
  };
  tags?: string[];
  isFavorite?: boolean;
  downloadCount?: number;
}

interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface AdvancedFileSharingProps {
  threadId?: string;
  conversationId?: string;
  currentUserId: string;
  onFileSelect: (files: File[]) => void;
  onFileUploaded: (attachment: FileAttachment) => void;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
}

export function AdvancedFileSharing({
  threadId,
  conversationId,
  currentUserId,
  onFileSelect,
  onFileUploaded,
  maxFileSize = 50 * 1024 * 1024, // 50MB
  allowedTypes = ['image/*', 'video/*', 'audio/*', 'application/pdf', '.doc,.docx,.txt']
}: AdvancedFileSharingProps) {
  const [uploadedFiles, setUploadedFiles] = useState<FileAttachment[]>([]);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState<FileAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock uploaded files data
  useState(() => {
    const mockFiles: FileAttachment[] = [
      {
        id: '1',
        name: 'presentation.pdf',
        type: 'application/pdf',
        size: 2048576,
        url: '/files/presentation.pdf',
        thumbnailUrl: '/thumbnails/presentation.jpg',
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        uploadedBy: {
          id: 'user1',
          firstName: 'John',
          lastName: 'Doe'
        },
        metadata: { pages: 24 },
        tags: ['presentation', 'important'],
        isFavorite: true,
        downloadCount: 15
      },
      {
        id: '2',
        name: 'meeting-recording.mp4',
        type: 'video/mp4',
        size: 52428800,
        url: '/files/meeting-recording.mp4',
        thumbnailUrl: '/thumbnails/meeting.jpg',
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        uploadedBy: {
          id: 'user2',
          firstName: 'Sarah',
          lastName: 'Johnson'
        },
        metadata: { duration: 3600, width: 1920, height: 1080 },
        tags: ['meeting', 'video'],
        downloadCount: 8
      },
      {
        id: '3',
        name: 'notes.txt',
        type: 'text/plain',
        size: 1024,
        url: '/files/notes.txt',
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        uploadedBy: {
          id: 'user3',
          firstName: 'Mike',
          lastName: 'Wilson'
        },
        tags: ['notes', 'text'],
        downloadCount: 3
      }
    ];
    setUploadedFiles(mockFiles);
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4 text-green-500" />;
    if (fileType.startsWith('video/')) return <Video className="w-4 h-4 text-blue-500" />;
    if (fileType.startsWith('audio/')) return <Music className="w-4 h-4 text-purple-500" />;
    if (fileType.includes('pdf') || fileType.includes('document')) return <FileText className="w-4 h-4 text-red-500" />;
    if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="w-4 h-4 text-yellow-500" />;
    return <File className="w-4 h-4 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      if (file.size > maxFileSize) {
        alert(`File ${file.name} exceeds maximum size of ${formatFileSize(maxFileSize)}`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      onFileSelect(validFiles);
      simulateFileUpload(validFiles);
    }
  }, [maxFileSize, onFileSelect]);

  const simulateFileUpload = (files: File[]) => {
    const uploadItems: FileUploadProgress[] = files.map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }));

    setUploadProgress(prev => [...prev, ...uploadItems]);

    uploadItems.forEach((item, index) => {
      setTimeout(() => {
        setUploadProgress(prev => 
          prev.map((p, i) => 
            i === prev.length - uploadItems.length + index
              ? { ...p, status: 'uploading' }
              : p
          )
        );

        // Simulate upload progress
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 30;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            setUploadProgress(prev => 
              prev.map((p, i) => 
                i === prev.length - uploadItems.length + index
                  ? { ...p, progress: 100, status: 'completed' }
                  : p
              )
            );

            // Add to uploaded files
            const newAttachment: FileAttachment = {
              id: `file_${Date.now()}_${index}`,
              name: item.file.name,
              type: item.file.type,
              size: item.file.size,
              url: URL.createObjectURL(item.file),
              uploadedAt: new Date().toISOString(),
              uploadedBy: {
                id: currentUserId,
                firstName: 'Current',
                lastName: 'User'
              }
            };

            setUploadedFiles(prev => [newAttachment, ...prev]);
            onFileUploaded(newAttachment);

            // Remove from upload progress after delay
            setTimeout(() => {
              setUploadProgress(prev => prev.filter((p, i) => 
                i !== prev.length - uploadItems.length + index
              ));
            }, 2000);
          } else {
            setUploadProgress(prev => 
              prev.map((p, i) => 
                i === prev.length - uploadItems.length + index
                  ? { ...p, progress }
                  : p
              )
            );
          }
        }, 200);
      }, index * 100);
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const filteredFiles = uploadedFiles.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const FilePreview = ({ file }: { file: FileAttachment }) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isPDF = file.type.includes('pdf');

    return (
      <div className="space-y-4">
        {/* Preview */}
        <div className="bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '200px' }}>
          {isImage && file.thumbnailUrl && (
            <img 
              src={file.thumbnailUrl} 
              alt={file.name}
              className="w-full h-auto max-h-96 object-contain"
            />
          )}
          {isVideo && (
            <video controls className="w-full max-h-96">
              <source src={file.url} type={file.type} />
              Your browser does not support the video tag.
            </video>
          )}
          {isPDF && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto text-red-500 mb-4" />
                <p className="text-gray-600">PDF Preview</p>
                <p className="text-sm text-gray-500 mt-2">
                  {file.metadata?.pages} pages
                </p>
              </div>
            </div>
          )}
          {!isImage && !isVideo && !isPDF && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                {getFileIcon(file.type)}
                <p className="text-gray-600 mt-4">Preview not available</p>
              </div>
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">{file.name}</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>{formatFileSize(file.size)}</span>
            <span>Uploaded {new Date(file.uploadedAt).toLocaleDateString()}</span>
            <span>by {file.uploadedBy.firstName} {file.uploadedBy.lastName}</span>
          </div>
          
          {file.metadata && (
            <div className="text-sm text-gray-600">
              {file.metadata.duration && (
                <span>Duration: {formatDuration(file.metadata.duration)}</span>
              )}
              {file.metadata.width && file.metadata.height && (
                <span>Dimensions: {file.metadata.width}×{file.metadata.height}</span>
              )}
              {file.metadata.pages && (
                <span>Pages: {file.metadata.pages}</span>
              )}
            </div>
          )}

          {file.tags && file.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {file.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Star className="w-4 h-4 mr-2" />
            {file.isFavorite ? 'Unfavorite' : 'Favorite'}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Drop files here or click to upload
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Maximum file size: {formatFileSize(maxFileSize)}
        </p>
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="w-4 h-4 mr-2" />
          Choose Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">Uploading Files</h3>
          {uploadProgress.map((item, index) => (
            <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate">{item.file.name}</span>
                  <span className="text-xs text-gray-500">
                    {formatFileSize(item.file.size)}
                  </span>
                </div>
                <Progress 
                  value={item.progress} 
                  className="h-2"
                />
              </div>
              <div className="text-xs text-gray-500">
                {item.status === 'uploading' && `${Math.round(item.progress)}%`}
                {item.status === 'completed' && 'Done'}
                {item.status === 'error' && 'Error'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Browser */}
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
            {selectedFiles.length > 0 && (
              <Badge variant="secondary">
                {selectedFiles.length} selected
              </Badge>
            )}
          </div>
        </div>

        {/* File Grid/List */}
        <ScrollArea className="h-96">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredFiles.map((file) => (
                <Card 
                  key={file.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    selectedFiles.includes(file.id) ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => toggleFileSelection(file.id)}
                >
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                      {file.thumbnailUrl ? (
                        <img 
                          src={file.thumbnailUrl} 
                          alt={file.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        getFileIcon(file.type)
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {new Date(file.uploadedAt).toLocaleDateString()}
                        </span>
                        {file.isFavorite && (
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles.map((file) => (
                <Card 
                  key={file.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    selectedFiles.includes(file.id) ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => toggleFileSelection(file.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{formatFileSize(file.size)}</span>
                          <span>by {file.uploadedBy.firstName}</span>
                          <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {file.isFavorite && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPreview(file);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* File Preview Dialog */}
      <Dialog open={!!showPreview} onOpenChange={() => setShowPreview(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>File Preview</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {showPreview && <FilePreview file={showPreview} />}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
