'use client';

import { useEffect, useState } from 'react';
import { Calendar, Eye, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PublishedResume {
  resume: {
    id: string;
    title: string;
    summary?: string;
    skills: string[];
    targetRoles: string[];
    targetIndustry?: string;
    location?: string;
    experiences: Array<{
      id: string;
      company: string;
      role: string;
      startDate: string;
      endDate?: string;
      description?: string;
      achievements: string[];
    }>;
    education: Array<{
      id: string;
      school: string;
      degree?: string;
      field?: string;
      summary?: string;
    }>;
    projects: Array<{
      id: string;
      name: string;
      summary?: string;
      link?: string;
      techStack: string[];
    }>;
  };
  publisherName: string;
  publishedAt: string;
  viewCount: number;
}

interface PublicResumeViewerProps {
  publicId: string;
}

export function PublicResumeViewer({ publicId }: PublicResumeViewerProps) {
  const [resume, setResume] = useState<PublishedResume | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResume = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/public/resumes/${publicId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Resume not found or not published');
          } else {
            setError('Failed to load resume');
          }
          return;
        }

        const data = await response.json();
        setResume(data);
      } catch (err) {
        setError('Failed to load resume');
        console.error('Error fetching resume:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResume();
  }, [publicId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading resume...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600">Resume not found</p>
      </div>
    );
  }

  const publishedDate = new Date(resume.publishedAt);
  const formattedDate = publishedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{resume.resume.title}</h1>
              <p className="text-slate-600 mt-1">by {resume.publisherName}</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{resume.viewCount} views</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Published {formattedDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Summary */}
        {resume.resume.summary && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">Professional Summary</h2>
            <p className="text-slate-700 leading-relaxed">{resume.resume.summary}</p>
          </section>
        )}

        {/* Target Info */}
        <section className="mb-8 bg-white rounded-lg p-6 border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {resume.resume.targetRoles.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Target Roles</h3>
                <div className="flex flex-wrap gap-2">
                  {resume.resume.targetRoles.map((role, idx) => (
                    <span
                      key={idx}
                      className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {resume.resume.targetIndustry && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Target Industry</h3>
                <p className="text-slate-700">{resume.resume.targetIndustry}</p>
              </div>
            )}
            {resume.resume.location && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Location</h3>
                <p className="text-slate-700">{resume.resume.location}</p>
              </div>
            )}
          </div>
        </section>

        {/* Skills */}
        {resume.resume.skills.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {resume.resume.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-block bg-slate-200 text-slate-800 text-sm px-3 py-1 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Experience */}
        {resume.resume.experiences.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Experience</h2>
            <div className="space-y-6">
              {resume.resume.experiences.map((exp) => (
                <div key={exp.id} className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-lg font-semibold text-slate-900">{exp.role}</h3>
                  <p className="text-slate-600">{exp.company}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {new Date(exp.startDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                    })}{' '}
                    -{' '}
                    {exp.endDate
                      ? new Date(exp.endDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                        })
                      : 'Present'}
                  </p>
                  {exp.description && (
                    <p className="text-slate-700 mt-2">{exp.description}</p>
                  )}
                  {exp.achievements.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {exp.achievements.map((achievement, idx) => (
                        <li key={idx} className="text-slate-700 text-sm">
                          • {achievement}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {resume.resume.education.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Education</h2>
            <div className="space-y-4">
              {resume.resume.education.map((edu) => (
                <div key={edu.id} className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-lg font-semibold text-slate-900">{edu.school}</h3>
                  {edu.degree && (
                    <p className="text-slate-600">
                      {edu.degree}
                      {edu.field && ` in ${edu.field}`}
                    </p>
                  )}
                  {edu.summary && (
                    <p className="text-slate-700 mt-2">{edu.summary}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {resume.resume.projects.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Projects</h2>
            <div className="space-y-4">
              {resume.resume.projects.map((project) => (
                <div key={project.id} className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900">{project.name}</h3>
                      {project.summary && (
                        <p className="text-slate-700 mt-1">{project.summary}</p>
                      )}
                      {project.techStack.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {project.techStack.map((tech, idx) => (
                            <span
                              key={idx}
                              className="inline-block bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {project.link && (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium ml-4"
                      >
                        View →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
