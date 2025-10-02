import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const CalendarAuthCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing calendar authorization...');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        setStatus('error');
        setMessage(`Authorization failed: ${error}`);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No authorization code received');
        return;
      }

      if (!user) {
        setStatus('error');
        setMessage('User not authenticated');
        return;
      }

      try {
        // Get the current session token
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          throw new Error('No valid session found');
        }

        // Get Supabase URL from environment
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl) {
          throw new Error('Missing VITE_SUPABASE_URL environment variable');
        }

        // Call the OAuth edge function
        const response = await fetch(
          `${supabaseUrl}/functions/v1/calendar-oauth?code=${code}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          setStatus('success');
          setMessage('Google Calendar connected successfully!');
          
          toast({
            title: "Success",
            description: "Your Google Calendar has been connected successfully.",
          });

          // Close the popup window if this is running in one
          if (window.opener) {
            window.opener.postMessage({ type: 'calendar-auth-success' }, '*');
            window.close();
          } else {
            // Redirect to calendar settings after a delay
            setTimeout(() => {
              window.location.href = '/calendar-settings';
            }, 2000);
          }
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process authorization');
        }
      } catch (error) {
        console.error('Calendar auth callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
        
        toast({
          title: "Error",
          description: "Failed to connect Google Calendar. Please try again.",
          variant: "destructive",
        });
      }
    };

    handleCallback();
  }, [user, toast]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-500" />;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {getStatusIcon()}
            Calendar Authorization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            {message}
          </p>
          {status === 'success' && (
            <p className="text-center text-xs text-muted-foreground mt-4">
              This window will close automatically...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarAuthCallback;