import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Agency {
  id: string;
  name: string;
  created_at: string;
  owner_user_id: string;
}

export const useAgency = () => {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAgency = async () => {
    if (!user) {
      setAgency(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get user's profile to find agency_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        throw new Error('Failed to fetch user profile');
      }

      if (!profile?.agency_id) {
        setAgency(null);
        setLoading(false);
        return;
      }

      // Get agency details
      const { data: agencyData, error: agencyError } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', profile.agency_id)
        .single();

      if (agencyError) {
        throw new Error('Failed to fetch agency details');
      }

      setAgency(agencyData);
    } catch (err) {
      console.error('Error fetching agency:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgency();
  }, [user]);

  // Helper function to get current agency ID for queries
  const getCurrentAgencyId = (): string | null => {
    return agency?.id || null;
  };

  // Helper function to scope queries by agency
  const scopeByAgency = <T extends Record<string, any>>(query: any): any => {
    const agencyId = getCurrentAgencyId();
    if (!agencyId) {
      throw new Error('No agency found for current user');
    }
    return query.eq('agency_id', agencyId);
  };

  return {
    agency,
    loading,
    error,
    refetch: fetchAgency,
    getCurrentAgencyId,
    scopeByAgency,
    agencyId: agency?.id || null
  };
};