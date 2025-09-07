import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { calendarService, CalendarIntegration } from '@/services/calendar';
import { Calendar, ExternalLink, Settings, Trash2 } from 'lucide-react';

const CalendarSettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchIntegrations();
    }
  }, [user]);

  const fetchIntegrations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await calendarService.getIntegrations(user.id);
      setIntegrations(data);
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
      toast({
        title: "Error",
        description: "Failed to load calendar integrations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const authUrl = await calendarService.initGoogleAuth();
      window.open(authUrl, '_blank', 'width=600,height=700,scrollbars=yes,resizable=yes');
      
      toast({
        title: "Authorization Required",
        description: "Please complete the authorization in the new window",
      });
    } catch (error) {
      console.error('Failed to initiate Google auth:', error);
      toast({
        title: "Error",
        description: "Failed to connect to Google Calendar",
        variant: "destructive",
      });
    }
  };

  const handleToggleIntegration = async (integrationId: string, isActive: boolean) => {
    try {
      await calendarService.toggleIntegration(integrationId, isActive);
      setIntegrations(prev => 
        prev.map(integration => 
          integration.id === integrationId 
            ? { ...integration, is_active: isActive }
            : integration
        )
      );
      
      toast({
        title: "Success",
        description: `Calendar sync ${isActive ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Failed to toggle integration:', error);
      toast({
        title: "Error",
        description: "Failed to update calendar integration",
        variant: "destructive",
      });
    }
  };

  const getProviderDisplayName = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'Google Calendar';
      case 'outlook':
        return 'Outlook Calendar';
      default:
        return provider;
    }
  };

  const getStatusBadge = (integration: CalendarIntegration) => {
    if (!integration.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    if (integration.expires_at && new Date(integration.expires_at) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    return <Badge variant="default">Active</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Integration
          </CardTitle>
          <CardDescription>
            Loading calendar settings...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendar Integration
        </CardTitle>
        <CardDescription>
          Sync your appointments with external calendar applications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connected Integrations */}
        {integrations.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Connected Calendars</h4>
            {integrations.map((integration) => (
              <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">
                      {getProviderDisplayName(integration.provider)}
                    </span>
                  </div>
                  {getStatusBadge(integration)}
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={integration.is_active}
                    onCheckedChange={(checked) => handleToggleIntegration(integration.id, checked)}
                    disabled={integration.expires_at && new Date(integration.expires_at) < new Date()}
                  />
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Separator />

        {/* Add New Integration */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Connect New Calendar</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="flex items-center gap-2 h-auto p-4"
              onClick={handleConnectGoogle}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Google Calendar</div>
                  <div className="text-sm text-muted-foreground">
                    Sync with your Google account
                  </div>
                </div>
              </div>
              <ExternalLink className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-2 h-auto p-4"
              disabled
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Outlook Calendar</div>
                  <div className="text-sm text-muted-foreground">
                    Coming soon
                  </div>
                </div>
              </div>
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h5 className="font-medium mb-2">How it works</h5>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Connect your preferred calendar application</li>
            <li>• New appointments will automatically sync to your calendar</li>
            <li>• Updates and cancellations are reflected in real-time</li>
            <li>• You can disable sync anytime without losing data</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarSettings;