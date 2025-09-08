import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUserRole = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('agency_id')
          .eq('user_id', user.id)
          .single();

        if (!profile?.agency_id) {
          setUserRole(null);
          setLoading(false);
          return;
        }

        const { data: member } = await supabase
          .from('agency_members')
          .select('role')
          .eq('agency_id', profile.agency_id)
          .eq('user_id', user.id)
          .single();

        setUserRole(member?.role || null);
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const isAdmin = userRole === 'owner' || userRole === 'admin';
  const canManageCampaigns = isAdmin;

  return {
    userRole,
    isAdmin,
    canManageCampaigns,
    loading
  };
};