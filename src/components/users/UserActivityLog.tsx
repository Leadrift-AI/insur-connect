import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserActivity } from '@/hooks/useUserActivity';
import { Activity, User, FileText, Settings, Shield, Eye } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export const UserActivityLog = () => {
  const { activityLogs, loading } = useUserActivity();

  const getActionIcon = (action: string) => {
    if (action.includes('login') || action.includes('auth')) return User;
    if (action.includes('create') || action.includes('add')) return FileText;
    if (action.includes('update') || action.includes('edit')) return Settings;
    if (action.includes('delete') || action.includes('remove')) return Shield;
    if (action.includes('view') || action.includes('read')) return Eye;
    return Activity;
  };

  const getActionColor = (action: string) => {
    if (action.includes('delete') || action.includes('remove')) return 'destructive';
    if (action.includes('create') || action.includes('add')) return 'default';
    if (action.includes('update') || action.includes('edit')) return 'secondary';
    return 'outline';
  };

  if (!loading && activityLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No activity recorded yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {activityLogs.map((log) => {
              const ActionIcon = getActionIcon(log.action);
              return (
                <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="mt-0.5">
                    <ActionIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {log.profiles.full_name || log.profiles.email || 'Unknown User'}
                      </span>
                      <Badge variant={getActionColor(log.action)} className="text-xs">
                        {log.action}
                      </Badge>
                    </div>
                    
                    {log.resource_type && (
                      <p className="text-sm text-muted-foreground">
                        {log.resource_type} {log.resource_id && `(${log.resource_id.slice(0, 8)}...)`}
                      </p>
                    )}
                    
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {Object.entries(log.details).map(([key, value]) => (
                          <span key={key} className="mr-3">
                            {key}: {JSON.stringify(value)}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                      <span>•</span>
                      <span>{format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};