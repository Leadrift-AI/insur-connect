import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type UserRole = 'owner' | 'admin' | 'agent' | 'staff' | 'manager';

export const useUserRole = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setUserRole(null);
        setAgencyId(null);
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
          setAgencyId(null);
          setLoading(false);
          return;
        }

        setAgencyId(profile.agency_id);

        const { data: member } = await supabase
          .from('agency_members')
          .select('role')
          .eq('agency_id', profile.agency_id)
          .eq('user_id', user.id)
          .single();

        setUserRole((member?.role as UserRole) || null);
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
        setAgencyId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  // Role-based permissions
  const isOwner = userRole === 'owner';
  const isAdmin = userRole === 'owner' || userRole === 'admin';
  const isAgent = userRole === 'agent';
  const isStaff = userRole === 'staff';
  const isManager = userRole === 'manager'; // Read-only role
  
  // Permission checks
  const canManageUsers = isOwner || isAdmin;
  const canManageCampaigns = isOwner || isAdmin;
  const canManageLeads = isOwner || isAdmin || isAgent;
  const canViewReports = isOwner || isAdmin || isManager;
  const canManageBilling = isOwner;
  const canViewDashboard = userRole !== null;
  const isReadOnly = isManager;

  return {
    userRole,
    agencyId,
    isOwner,
    isAdmin,
    isAgent,
    isStaff,
    isManager,
    canManageUsers,
    canManageCampaigns,
    canManageLeads,
    canViewReports,
    canManageBilling,
    canViewDashboard,
    isReadOnly,
    loading
  };
};