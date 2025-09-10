import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAgency } from './useAgency';
import { useKPIData } from './useKPIData';

interface UseRealtimeKPIsProps {
  dateRange?: { from?: Date; to?: Date };
  debounceMs?: number;
}

export const useRealtimeKPIs = ({ dateRange = {}, debounceMs = 2000 }: UseRealtimeKPIsProps = {}) => {
  const { agencyId } = useAgency();
  const kpiHook = useKPIData(dateRange);
  const debounceRef = useRef<NodeJS.Timeout>();

  const debouncedRefetch = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      kpiHook.refetch();
    }, debounceMs);
  }, [kpiHook.refetch, debounceMs]);

  useEffect(() => {
    if (!agencyId) return;

    console.log('Setting up realtime subscriptions for agency:', agencyId);

    // Subscribe to leads changes for current agency
    const leadsChannel = supabase
      .channel(`leads-${agencyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `agency_id=eq.${agencyId}`
        },
        (payload) => {
          console.log('Leads change detected:', payload);
          debouncedRefetch();
        }
      )
      .subscribe();

    // Subscribe to appointments changes for current agency
    const appointmentsChannel = supabase
      .channel(`appointments-${agencyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `agency_id=eq.${agencyId}`
        },
        (payload) => {
          console.log('Appointments change detected:', payload);
          debouncedRefetch();
        }
      )
      .subscribe();

    // Subscribe to policies changes for current agency
    const policiesChannel = supabase
      .channel(`policies-${agencyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'policies',
          filter: `agency_id=eq.${agencyId}`
        },
        (payload) => {
          console.log('Policies change detected:', payload);
          debouncedRefetch();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscriptions');
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(appointmentsChannel);
      supabase.removeChannel(policiesChannel);
      
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [agencyId, debouncedRefetch]);

  return kpiHook;
};