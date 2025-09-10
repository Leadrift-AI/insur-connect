import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAgency } from './useAgency';

interface PlanLimits {
  canUseCalendarSync: boolean;
  canExportReports: boolean;
  maxUsers: number;
  maxLeadsPerMonth: number;
  currentPlan: string;
}

export const usePlanGating = () => {
  const [planLimits, setPlanLimits] = useState<PlanLimits>({
    canUseCalendarSync: false,
    canExportReports: false,
    maxUsers: 1,
    maxLeadsPerMonth: 50,
    currentPlan: 'free'
  });
  const [loading, setLoading] = useState(true);
  const { agency } = useAgency();

  useEffect(() => {
    if (agency) {
      checkPlanLimits();
    }
  }, [agency]);

  const checkPlanLimits = async () => {
    if (!agency) return;

    try {
      setLoading(true);
      
      const plan = (agency as any).plan || 'free';
      const seats = (agency as any).seats || 1;
      
      const limits: PlanLimits = {
        currentPlan: plan,
        maxUsers: seats,
        canUseCalendarSync: plan !== 'free',
        canExportReports: plan !== 'free',
        maxLeadsPerMonth: getLeadLimitForPlan(plan)
      };

      setPlanLimits(limits);
    } catch (error) {
      console.error('Error checking plan limits:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLeadLimitForPlan = (plan: string): number => {
    switch (plan) {
      case 'starter': return 500;
      case 'professional': return 2000;
      case 'enterprise': return 999999; // "unlimited"
      default: return 50; // free plan
    }
  };

  const requiresPaidPlan = (feature: 'calendar' | 'export') => {
    return {
      allowed: feature === 'calendar' ? planLimits.canUseCalendarSync : planLimits.canExportReports,
      currentPlan: planLimits.currentPlan,
      upgradeMessage: `This feature requires a paid plan. You're currently on the ${planLimits.currentPlan} plan.`
    };
  };

  return {
    planLimits,
    loading,
    requiresPaidPlan,
    refetch: checkPlanLimits
  };
};