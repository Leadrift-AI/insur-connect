import React from 'react';
import * as Sentry from '@sentry/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const DebugSentry: React.FC = () => {
  const throwError = () => {
    try {
      throw new Error('Sentry debug test error');
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  };

  const captureMessage = () => {
    Sentry.captureMessage('Sentry debug test message', { level: 'info' });
  };

  return (
    <div className="p-6 flex justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 space-y-4">
          <h1 className="text-xl font-semibold">Debug Sentry</h1>
          <p className="text-sm text-muted-foreground">
            Use these buttons to verify Sentry is capturing events.
          </p>
          <div className="flex gap-3">
            <Button variant="destructive" onClick={throwError}>
              Throw and capture error
            </Button>
            <Button variant="secondary" onClick={captureMessage}>
              Capture message
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DebugSentry;

