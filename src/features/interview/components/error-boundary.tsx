'use client';

import React, { ReactNode, ReactElement } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactElement;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.retry);
      }

      return (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <AlertCircle className="h-10 w-10 text-rose-600" />
            <div className="text-center">
              <h3 className="font-semibold text-rose-900">Something went wrong</h3>
              <p className="text-sm text-rose-700 mt-1">
                {this.state.error.message || 'An unexpected error occurred'}
              </p>
            </div>
            <Button
              onClick={this.retry}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export function ErrorAlert({
  error,
  onRetry,
  title = 'Error',
}: {
  error: string | Error;
  onRetry?: () => void;
  title?: string;
}) {
  const message = typeof error === 'string' ? error : error.message;

  return (
    <Card className="border-rose-200 bg-rose-50">
      <CardContent className="flex items-start gap-3 py-4">
        <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-rose-900">{title}</h4>
          <p className="text-sm text-rose-700 mt-1">{message}</p>
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="mt-3 gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
