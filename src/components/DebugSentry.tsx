import * as Sentry from '@sentry/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugSentry() {
  const handleTestError = () => {
    Sentry.captureException(new Error('Debug: web test event'));
    console.log('Sentry test error sent');
  };

  const handleTestPerformance = () => {
    // Add breadcrumb for performance test
    Sentry.addBreadcrumb({
      message: 'Test performance event triggered',
      level: 'info',
      category: 'debug',
    });

    console.log('Sentry test performance event sent');
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sentry Debug Tools</CardTitle>
        <CardDescription>
          Test Sentry error monitoring and performance tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleTestError} variant="destructive" className="w-full">
          Send Test Error
        </Button>
        <Button onClick={handleTestPerformance} variant="outline" className="w-full">
          Send Test Performance Event
        </Button>
      </CardContent>
    </Card>
  );
}