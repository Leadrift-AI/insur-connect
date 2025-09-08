import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="w-full max-w-md mx-auto mt-8 animate-fade-in">
          <CardContent className="p-6 text-center">
            <div className="rounded-full bg-destructive/10 p-3 w-fit mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Something went wrong
            </h3>
            
            <p className="text-sm text-muted-foreground mb-4">
              We apologize for the inconvenience. Please try refreshing the page.
            </p>
            
            <Button 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer">
                  Error Details
                </summary>
                <pre className="text-xs text-destructive mt-2 p-2 bg-destructive/5 rounded">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook for handling async errors
export function useErrorHandler() {
  return (error: Error, errorInfo?: string) => {
    console.error('Error:', error, errorInfo);
    // In a real app, you might want to send this to an error reporting service
  };
}