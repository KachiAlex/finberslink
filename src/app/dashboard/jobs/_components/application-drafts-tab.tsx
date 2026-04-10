"use client";

import { useState, useEffect } from "react";
import { 
  FileText, 
  Clock, 
  Edit, 
  Trash2, 
  Send, 
  AlertCircle,
  CheckCircle,
  Eye,
  ExternalLink,
  Calendar
} from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { Progress } from "../../../../components/ui/progress";
import { formatDistanceToNow } from "date-fns";

interface ApplicationDraft {
  id: string;
  userId: string;
  jobOpportunityId: string;
  resumeId?: string;
  coverLetter?: string;
  answers?: Record<string, string>;
  lastSavedAt: Date;
  jobOpportunity?: {
    id: string;
    title: string;
    company: string;
    location: string;
    slug: string;
  };
  resume?: {
    id: string;
    title: string;
    slug: string;
  };
}

interface ApplicationDraftsTabProps {
  userId: string;
}

export function ApplicationDraftsTab({ userId }: ApplicationDraftsTabProps) {
  const [drafts, setDrafts] = useState<ApplicationDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingDraftId, setSubmittingDraftId] = useState<string | null>(null);
  const [deletingDraftId, setDeletingDraftId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadDrafts();
  }, [userId]);

  const loadDrafts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/jobs/drafts?userId=${userId}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setDrafts(data.drafts || []);
      }
    } catch (error) {
      console.error('Failed to load drafts:', error);
      setMessage({ type: 'error', text: 'Failed to load application drafts' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDraft = async (draftId: string, jobOpportunityId: string) => {
    setDeletingDraftId(draftId);
    try {
      const response = await fetch(`/api/jobs/drafts/${draftId}`, { method: 'DELETE' });
      if (response.ok) {
        setDrafts(prev => prev.filter(d => d.id !== draftId));
        setMessage({ type: 'success', text: 'Draft deleted successfully' });
      }
    } catch (error) {
      console.error('Failed to delete draft:', error);
      setMessage({ type: 'error', text: 'Failed to delete draft' });
    } finally {
      setDeletingDraftId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSubmitDraft = async (draft: ApplicationDraft) => {
    setSubmittingDraftId(draft.id);
    try {
      const response = await fetch(`/api/jobs/drafts/${draft.id}/submit`, { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        setDrafts(prev => prev.filter(d => d.id !== draft.id));
        setMessage({ type: 'success', text: 'Application submitted successfully!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to submit application' });
      }
    } catch (error) {
      console.error('Failed to submit draft:', error);
      setMessage({ type: 'error', text: 'Failed to submit application' });
    } finally {
      setSubmittingDraftId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const getDraftCompletionPercentage = (draft: ApplicationDraft): number => {
    let completed = 0;
    let total = 2; // resume + cover letter
    
    if (draft.resumeId) completed++;
    if (draft.coverLetter) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const isDraftReadyForSubmission = (draft: ApplicationDraft): boolean => {
    return !!draft.resumeId;
  };

  const getCompletionStatus = (draft: ApplicationDraft) => {
    const percentage = getDraftCompletionPercentage(draft);
    
    if (percentage === 100) {
      return { color: 'text-green-600', bg: 'bg-green-100', label: 'Complete' };
    } else if (percentage >= 60) {
      return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'In Progress' };
    } else {
      return { color: 'text-red-600', bg: 'bg-red-100', label: 'Just Started' };
    }
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
          <h3 className="text-lg font-semibold text-slate-900">Application Drafts</h3>
          <p className="text-sm text-slate-600">
            Continue working on your job applications
          </p>
        </div>
        <Badge variant="outline">
          {drafts.length} drafts
        </Badge>
      </div>

      {/* Message Alert */}
      {message && (
        <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Drafts List */}
      {drafts.length === 0 ? (
        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-16 h-16 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Application Drafts</h3>
            <p className="text-slate-600 text-center mb-4">
              Start applying to jobs and your drafts will appear here
            </p>
            <Button asChild>
              <a href="/jobs">Browse Jobs</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {drafts.map((draft) => {
            const completionStatus = getCompletionStatus(draft);
            const completionPercentage = getDraftCompletionPercentage(draft);
            const isReady = isDraftReadyForSubmission(draft);
            
            return (
              <Card key={draft.id} className="border-slate-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-medium text-slate-900 truncate">
                          {draft.jobOpportunity?.title}
                        </h4>
                        <Badge className={completionStatus.bg + ' ' + completionStatus.color}>
                          {completionStatus.label}
                        </Badge>
                      </div>
                      <p className="text-slate-600 mb-1">
                        {draft.jobOpportunity?.company}
                      </p>
                      <p className="text-sm text-slate-500 mb-3">
                        {draft.jobOpportunity?.location}
                      </p>
                      
                      {/* Completion Progress */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-slate-600">Completion</span>
                          <span className="font-medium">{completionPercentage}%</span>
                        </div>
                        <Progress value={completionPercentage} className="h-2" />
                      </div>

                      {/* Draft Details */}
                      <div className="space-y-2 text-sm">
                        {draft.resumeId && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>Resume selected: {draft.resume?.title}</span>
                          </div>
                        )}
                        {draft.coverLetter && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>Cover letter written ({draft.coverLetter.length} characters)</span>
                          </div>
                        )}
                        {!draft.resumeId && (
                          <div className="flex items-center gap-2 text-amber-600">
                            <AlertCircle className="w-4 h-4" />
                            <span>Resume required to submit</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 ml-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span>
                            {formatDistanceToNow(new Date(draft.lastSavedAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                      >
                        <a href={`/jobs/${draft.jobOpportunity?.slug}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Job
                        </a>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                      >
                        <a href={`/jobs/${draft.jobOpportunity?.slug}/apply?draft=true`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Continue
                        </a>
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteDraft(draft.id, draft.jobOpportunityId)}
                        disabled={deletingDraftId === draft.id}
                      >
                        {deletingDraftId === draft.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => handleSubmitDraft(draft)}
                        disabled={!isReady || submittingDraftId === draft.id}
                        className={!isReady ? 'opacity-50 cursor-not-allowed' : ''}
                      >
                        {submittingDraftId === draft.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Submit
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Warning for incomplete drafts */}
                  {!isReady && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-800 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>
                          Please select a resume before submitting this application
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tips Section */}
      {drafts.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <h4 className="font-medium mb-1">Tips for Your Applications</h4>
                <ul className="space-y-1 text-blue-700">
                  <li>Personalize your cover letter for each job</li>
                  <li>Double-check that your resume matches the job requirements</li>
                  <li>Save your progress often to avoid losing work</li>
                  <li>Submit applications within 24 hours of starting</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
