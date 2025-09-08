import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBilling } from '@/hooks/useBilling';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SubscriptionPlans from '@/components/billing/SubscriptionPlans';
import CurrentSubscription from '@/components/billing/CurrentSubscription';
import UsageTracking from '@/components/billing/UsageTracking';
import BillingHistory from '@/components/billing/BillingHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

const Billing = () => {
  const { user, loading: authLoading } = useAuth();
  const { subscription, usage, loading, refreshBillingData } = useBilling();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">Billing & Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage your subscription, usage, and billing information.
          </p>
        </div>
        
        <Tabs defaultValue="subscription" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="history">Billing History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="subscription" className="space-y-6">
            <CurrentSubscription 
              subscription={subscription} 
              onRefresh={refreshBillingData}
            />
          </TabsContent>
          
          <TabsContent value="usage" className="space-y-6">
            <UsageTracking 
              usage={usage}
              subscription={subscription}
              onRefresh={refreshBillingData}
            />
          </TabsContent>
          
          <TabsContent value="plans" className="space-y-6">
            <SubscriptionPlans 
              currentSubscription={subscription}
              onSubscribe={refreshBillingData}
            />
          </TabsContent>
          
          <TabsContent value="history" className="space-y-6">
            <BillingHistory />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Billing;