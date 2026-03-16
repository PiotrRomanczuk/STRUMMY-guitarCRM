'use client';

import * as React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

interface V2ErrorBoundaryProps {
  children: React.ReactNode;
  /** Custom fallback UI. When omitted, a default card with retry is shown. */
  fallback?: React.ReactNode;
  /** Label shown in the default error card */
  label?: string;
}

interface V2ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Generic error boundary for v2 components.
 * Catches render errors and shows a friendly retry card.
 */
export class V2ErrorBoundary extends React.Component<
  V2ErrorBoundaryProps,
  V2ErrorBoundaryState
> {
  constructor(props: V2ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): V2ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('[V2ErrorBoundary] Caught error', error, {
      componentStack: errorInfo.componentStack ?? undefined,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const label = this.props.label ?? 'Something went wrong';

      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="text-base font-semibold mb-1">{label}</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={this.handleRetry}
            className="min-h-[44px]"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
