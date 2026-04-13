'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Globe, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface PublicationSettingsProps {
  resumeId: string;
  onPublished?: () => void;
  onUnpublished?: () => void;
}

interface PublicationStatus {
  published: boolean;
  publicUrl?: string;
  publicId?: string;
  publishedAt?: string;
  viewCount: number;
}

export function PublicationSettings({
  resumeId,
  onPublished,
  onUnpublished,
}: PublicationSettingsProps) {
  const [status, setStatus] = useState<PublicationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false);

  // Fetch publication status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/resume/publish-status/${resumeId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch publication status');
        }

        const data = await response.json();
        setStatus(data);
        setError(null);
      } catch (err) {
        setError('Failed to load publication status');
        console.error('Error fetching status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [resumeId]);

  const handlePublish = async () => {
    try {
      setPublishing(true);
      setError(null);

      const response = await fetch('/api/resume/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId,
          publish: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to publish resume');
      }

      const data = await response.json();
      setStatus(data);
      onPublished?.();
    } catch (err: any) {
      setError(err.message || 'Failed to publish resume');
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    try {
      setPublishing(true);
      setError(null);

      const response = await fetch('/api/resume/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId,
          publish: false,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to unpublish resume');
      }

      const data = await response.json();
      setStatus(data);
      setShowUnpublishDialog(false);
      onUnpublished?.();
    } catch (err: any) {
      setError(err.message || 'Failed to unpublish resume');
    } finally {
      setPublishing(false);
    }
  };

  const copyToClipboard = async () => {
    if (status?.publicUrl) {
      const fullUrl = `${window.location.origin}${status.publicUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Publication Status */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Publication Status</h3>
            <p className="text-sm text-slate-600 mt-1">
              {status?.published
                ? 'Your resume is publicly visible'
                : 'Your resume is not published'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {status?.published ? (
              <Globe className="h-5 w-5 text-green-600" />
            ) : (
              <Lock className="h-5 w-5 text-slate-400" />
            )}
          </div>
        </div>

        {status?.published && status?.publishedAt && (
          <div className="text-sm text-slate-600 mb-4">
            Published on {new Date(status.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        )}

        {status?.published && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900 font-medium mb-2">Public URL</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={`${window.location.origin}${status.publicUrl}`}
                readOnly
                className="flex-1 px-3 py-2 text-sm bg-white border border-blue-200 rounded text-slate-700"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={copyToClipboard}
                className="whitespace-nowrap"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {status?.published && (
          <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-600">
              <strong>Views:</strong> {status.viewCount}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!status?.published ? (
            <Button
              onClick={handlePublish}
              disabled={publishing}
              className="flex-1"
            >
              {publishing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Publish Resume
                </>
              )}
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="secondary"
                className="flex-1"
              >
                <a
                  href={status.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Public Profile
                </a>
              </Button>
              <Dialog open={showUnpublishDialog} onOpenChange={setShowUnpublishDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">Unpublish</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Unpublish Resume?</DialogTitle>
                    <DialogDescription>
                      This will remove your resume from public view. The public URL will no longer be accessible.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowUnpublishDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleUnpublish}
                      disabled={publishing}
                    >
                      {publishing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Unpublishing...
                        </>
                      ) : (
                        'Unpublish'
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Info Box */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {status?.published
            ? 'Your resume is publicly visible. Anyone with the link can view it.'
            : 'Publish your resume to make it visible to employers and share it with others.'}
        </AlertDescription>
      </Alert>
    </div>
  );
}
