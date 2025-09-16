import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const HealthCard: React.FC = () => {
  const [status, setStatus] = React.useState<'ok' | 'down' | 'unknown'>('unknown');
  const [ts, setTs] = React.useState<string>('');

  const check = React.useCallback(async () => {
    try {
      const res = await fetch(`${(import.meta as any).env.VITE_SUPABASE_URL || ''}/functions/v1/health`);
      const json = await res.json();
      setStatus(json.status === 'ok' ? 'ok' : 'down');
      setTs(json.timestamp);
    } catch {
      setStatus('down');
    }
  }, []);

  React.useEffect(() => {
    check();
  }, [check]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Badge variant={status === 'ok' ? 'default' : 'destructive'}>
            {status === 'ok' ? 'Healthy' : status === 'down' ? 'Down' : 'Unknown'}
          </Badge>
          {ts && <span className="text-sm text-muted-foreground">{new Date(ts).toLocaleString()}</span>}
        </div>
      </CardContent>
    </Card>
  );
};

