"use client";

import { useState, useEffect } from "react";
import { 
  Briefcase, 
  Users, 
  FileText, 
  TrendingUp, 
  Calendar, 
  Plus,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Building,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType: string;
  remoteOption: string;
  salaryRange?: string;
  isActive: boolean;
  featured: boolean;
  createdAt: string;
  applicationCount: number;
  viewCount: number;
}

interface Application {
  id: string;
  status: string;
  submittedAt: string;
  opportunity: {
    title: string;
    company: string;
  };
  user: {
    firstName: string;
    lastName: string;
    email: string;
    profile?: {
      headline?: string;
      location?: string;
      skills?: string[];
    };
  };
  resume?: {
    title: string;
    slug: string;
  };
}

interface EmployerDashboardProps {
  userId: string;
  userRole: string;
}

export function EmployerDashboard({ userId, userRole }: EmployerDashboardProps) {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Mock data for now - in real implementation, fetch from API
      const mockJobs: JobPosting[] = [
        {
          id: "1",
          title: "Senior Frontend Developer",
          company: "TechCorp",
          location: "San Francisco, CA",
          jobType: "FULL_TIME",
          remoteOption: "HYBRID",
          salaryRange: "$120k-$150k",
          isActive: true,
          featured: true,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          applicationCount: 23,
          viewCount: 456
        },
        {
          id: "2",
          title: "Product Manager",
          company: "TechCorp",
          location: "New York, NY",
          jobType: "FULL_TIME",
          remoteOption: "REMOTE",
          salaryRange: "$130k-$160k",
          isActive: true,
          featured: false,
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          applicationCount: 18,
          viewCount: 324
        },
        {
          id: "3",
          title: "UX Designer",
          company: "TechCorp",
          location: "Austin, TX",
          jobType: "CONTRACT",
          remoteOption: "ONSITE",
          salaryRange: "$80k-$100k",
          isActive: false,
          featured: false,
          createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
          applicationCount: 5,
          viewCount: 89
        }
      ];

      const mockApplications: Application[] = [
        {
          id: "1",
          status: "SUBMITTED",
          submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          opportunity: {
            title: "Senior Frontend Developer",
            company: "TechCorp"
          },
          user: {
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@email.com",
            profile: {
              headline: "Frontend Developer with 5 years experience",
              location: "San Francisco, CA",
              skills: ["React", "TypeScript", "Node.js"]
            }
          },
          resume: {
            title: "John Doe - Frontend Developer",
            slug: "john-doe-frontend"
          }
        },
        {
          id: "2",
          status: "IN_REVIEW",
          submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          opportunity: {
            title: "Senior Frontend Developer",
            company: "TechCorp"
          },
          user: {
            firstName: "Jane",
            lastName: "Smith",
            email: "jane.smith@email.com",
            profile: {
              headline: "Senior Full Stack Developer",
              location: "Remote",
              skills: ["React", "Python", "AWS"]
            }
          },
          resume: {
            title: "Jane Smith - Full Stack Developer",
            slug: "jane-smith-fullstack"
          }
        }
      ];

      setJobs(mockJobs);
      setApplications(mockApplications);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
      case 'IN_REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'INTERVIEW': return 'bg-purple-100 text-purple-800';
      case 'OFFERED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return <FileText className="w-4 h-4" />;
      case 'IN_REVIEW': return <Eye className="w-4 h-4" />;
      case 'INTERVIEW': return <Calendar className="w-4 h-4" />;
      case 'OFFERED': return <CheckCircle className="w-4 h-4" />;
      case 'REJECTED': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchQuery === "" || 
      app.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.opportunity.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter(job => job.isActive).length,
    totalApplications: applications.length,
    pendingReview: applications.filter(app => app.status === 'IN_REVIEW').length,
    totalViews: jobs.reduce((sum, job) => sum + job.viewCount, 0)
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Employer Dashboard</h1>
          <p className="text-slate-600">Manage your job postings and review applications</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Post New Job
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Jobs</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalJobs}</p>
              </div>
              <Briefcase className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Jobs</p>
                <p className="text-2xl font-bold text-slate-900">{stats.activeJobs}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Applications</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalApplications}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Pending Review</p>
                <p className="text-2xl font-bold text-slate-900">{stats.pendingReview}</p>
              </div>
              <Eye className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Views</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalViews}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">Job Postings</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Applications */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>Latest job applications received</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.slice(0, 5).map((application) => (
                    <div key={application.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {application.user.firstName[0]}{application.user.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {application.user.firstName} {application.user.lastName}
                          </p>
                          <p className="text-sm text-slate-600">{application.opportunity.title}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(application.status)}>
                          {application.status.replace('_', ' ')}
                        </Badge>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDistanceToNow(new Date(application.submittedAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Job Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Job Performance</CardTitle>
                <CardDescription>How your job postings are performing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobs.slice(0, 5).map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{job.title}</p>
                        <p className="text-sm text-slate-600">{job.location}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4 text-slate-500" />
                            <span>{job.viewCount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-slate-500" />
                            <span>{job.applicationCount}</span>
                          </div>
                        </div>
                        <Badge variant={job.isActive ? "default" : "secondary"} className="mt-1">
                          {job.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Job Postings</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Job Posting
            </Button>
          </div>

          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{job.title}</h3>
                        {job.featured && <Badge variant="secondary">Featured</Badge>}
                        <Badge variant={job.isActive ? "default" : "secondary"}>
                          {job.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-slate-600 mb-2">{job.company} · {job.location}</p>
                      <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                        <span>{job.jobType.replace('_', ' ')}</span>
                        <span>·</span>
                        <span>{job.remoteOption}</span>
                        {job.salaryRange && (
                          <>
                            <span>·</span>
                            <span>{job.salaryRange}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4 text-slate-500" />
                          <span>{job.viewCount} views</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-slate-500" />
                          <span>{job.applicationCount} applications</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span>Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Applications</h2>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search applications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="IN_REVIEW">In Review</SelectItem>
                  <SelectItem value="INTERVIEW">Interview</SelectItem>
                  <SelectItem value="OFFERED">Offered</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <Card key={application.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar>
                        <AvatarFallback>
                          {application.user.firstName[0]}{application.user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">
                            {application.user.firstName} {application.user.lastName}
                          </h3>
                          <Badge className={getStatusColor(application.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(application.status)}
                              <span>{application.status.replace('_', ' ')}</span>
                            </div>
                          </Badge>
                        </div>
                        <p className="text-slate-600 mb-1">{application.user.email}</p>
                        {application.user.profile?.headline && (
                          <p className="text-sm text-slate-600 mb-1">{application.user.profile.headline}</p>
                        )}
                        <p className="text-sm text-slate-600 mb-2">
                          Applied for: {application.opportunity.title} at {application.opportunity.company}
                        </p>
                        {application.user.profile?.skills && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {application.user.profile.skills.slice(0, 5).map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-slate-500">
                          Applied {formatDistanceToNow(new Date(application.submittedAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {application.resume && (
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-2" />
                          Resume
                        </Button>
                      )}
                      <Button size="sm">
                        Review
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
