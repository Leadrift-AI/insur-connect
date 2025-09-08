import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: any;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string | null;
  };
}

export const useUserActivity = () => {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const { agencyId, canManageUsers } = useUserRole();

  const fetchActivityLogs = async (limit: number = 50) => {
    if (!agencyId || !canManageUsers) return;

    setLoading(true);
    try {
      // First get activity logs, then get profile data separately
      const { data: logs, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get user profiles for the activity logs
      const userIds = [...new Set(logs?.map(log => log.user_id) || [])];
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine logs with profile data
      const logsWithProfiles = logs?.map(log => ({
        ...log,
        profiles: profiles?.find(p => p.user_id === log.user_id) || { full_name: null, email: null }
      })) || [];

      setActivityLogs(logsWithProfiles);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const logActivity = async (
    action: string,
    resourceType?: string,
    resourceId?: string,
    details?: any
  ) => {
    try {
      await supabase.rpc('log_user_activity', {
        p_action: action,
        p_resource_type: resourceType || null,
        p_resource_id: resourceId || null,
        p_details: details || {}
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const updateLastSeen = async () => {
    try {
      await supabase.rpc('update_user_last_seen');
    } catch (error) {
      console.error('Error updating last seen:', error);
    }
  };

  useEffect(() => {
    fetchActivityLogs();
  }, [agencyId, canManageUsers]);

  return {
    activityLogs,
    loading,
    fetchActivityLogs,
    logActivity,
    updateLastSeen
  };
};