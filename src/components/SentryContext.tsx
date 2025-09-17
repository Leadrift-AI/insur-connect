import * as Sentry from '@sentry/react';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAgency } from '@/hooks/useAgency';

export default function SentryContext() {
  const { user } = useAuth();
  const { agencyId } = useAgency();

  useEffect(() => {
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email ?? undefined
      });
    } else {
      Sentry.setUser(null);
    }
  }, [user]);

  useEffect(() => {
    if (agencyId) {
      Sentry.setTag('agency_id', agencyId);
    }
  }, [agencyId]);

  return null;
}