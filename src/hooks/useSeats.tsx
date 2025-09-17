import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';

export interface SeatUsage {
  totalSeats: number;
  activeAgents: number;
  pendingInvitations: number;
  availableSeats: number;
  canInviteMore: boolean;
}

export const useSeats = () => {
  const [seatUsage, setSeatUsage] = useState<SeatUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { agencyId } = useUserRole();

  const fetchSeatUsage = async () => {
    if (!agencyId) {
      setSeatUsage(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get agency seat limit
      const { data: agency, error: agencyError } = await supabase
        .from('agencies')
        .select('seats')
        .eq('id', agencyId)
        .single();

      if (agencyError) throw agencyError;

      const totalSeats = agency?.seats || 1;

      // Count active agents (agency members)
      const { count: activeAgents, error: membersError } = await supabase
        .from('agency_members')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', agencyId);

      if (membersError) throw membersError;

      // Count pending invitations
      const { count: pendingInvitations, error: invitationsError } = await supabase
        .from('user_invitations')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', agencyId)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString());

      if (invitationsError) throw invitationsError;

      const totalUsed = (activeAgents || 0) + (pendingInvitations || 0);
      const availableSeats = Math.max(0, totalSeats - totalUsed);
      const canInviteMore = availableSeats > 0;

      setSeatUsage({
        totalSeats,
        activeAgents: activeAgents || 0,
        pendingInvitations: pendingInvitations || 0,
        availableSeats,
        canInviteMore
      });
    } catch (err) {
      console.error('Error fetching seat usage:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeatUsage();
  }, [agencyId]);

  return {
    seatUsage,
    loading,
    error,
    refetch: fetchSeatUsage
  };
};