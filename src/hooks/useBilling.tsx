import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: any;
  max_agents: number | null;
  max_leads_per_month: number | null;
}

interface AgencySubscription {
  id: string;
  agency_id: string;
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  billing_cycle: string;
  subscription_plans: SubscriptionPlan;
}

interface Usage {
  agency_id: string;
  month_year: string;
  agents_count: number;
  leads_count: number;
  appointments_count: number;
  extra_agent_charges: number;
  extra_lead_charges: number;
  total_usage_charges: number;
}

export const useBilling = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<AgencySubscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshBillingData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's agency
      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.agency_id) {
        setLoading(false);
        return;
      }

      // Get subscription data
      const { data: subscriptionData } = await supabase
        .from('agency_subscriptions')
        .select(`
          *,
          subscription_plans(*)
        `)
        .eq('agency_id', profile.agency_id)
        .eq('status', 'active')
        .single();

      setSubscription(subscriptionData);

      // Get current month usage
      const currentDate = new Date();
      const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      const { data: usageData } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('agency_id', profile.agency_id)
        .eq('month_year', monthYear)
        .single();

      setUsage(usageData);

    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (planId: string, billingCycle: 'monthly' | 'yearly') => {
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { planId, billingCycle }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: "Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive"
      });
    }
  };

  const manageBilling = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('billing-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      toast({
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive"
      });
    }
  };

  const updateUsage = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('update-usage');

      if (error) throw error;

      toast({
        title: "Success",
        description: "Usage data updated successfully."
      });

      refreshBillingData();
    } catch (error) {
      console.error('Error updating usage:', error);
      toast({
        title: "Error",
        description: "Failed to update usage data. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      refreshBillingData();
    }
  }, [user]);

  return {
    subscription,
    usage,
    loading,
    refreshBillingData,
    createSubscription,
    manageBilling,
    updateUsage
  };
};