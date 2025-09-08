import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBilling } from '@/hooks/useBilling';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

interface SubscriptionPlansProps {
  currentSubscription?: any;
  onSubscribe: () => void;
}

const SubscriptionPlans = ({ currentSubscription, onSubscribe }: SubscriptionPlansProps) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { createSubscription } = useBilling();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    await createSubscription(planId, billingCycle);
    onSubscribe();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getFeatures = (features: any): string[] => {
    if (Array.isArray(features)) return features;
    if (typeof features === 'string') {
      try {
        return JSON.parse(features);
      } catch {
        return [];
      }
    }
    return [];
  };

  if (loading) {
    return <div>Loading plans...</div>;
  }

  const getPlanVariant = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'starter': return 'border-green-500';
      case 'growth': return 'border-blue-500';
      case 'scale': return 'border-red-500';
      default: return '';
    }
  };

  const getPlanBadgeColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'starter': return 'bg-green-500';
      case 'growth': return 'bg-blue-500';
      case 'scale': return 'bg-red-500';
      default: return 'bg-primary';
    }
  };

  const getPlanEmoji = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'starter': return '🟢';
      case 'growth': return '🔵';
      case 'scale': return '🔴';
      default: return '⭐';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">💵 Leadrift AI Pricing Tiers</h2>
        <p className="text-muted-foreground">
          Select the perfect plan for your agency's growth stage
        </p>
      </div>

      <Tabs value={billingCycle} onValueChange={(value) => setBillingCycle(value as 'monthly' | 'yearly')}>
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly (Save 10%)</TabsTrigger>
        </TabsList>

        <TabsContent value={billingCycle} className="mt-8">
          <div className="grid lg:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <Card key={plan.id} className={`relative border-2 ${getPlanVariant(plan.name)} ${index === 1 ? 'shadow-lg scale-105' : ''}`}>
                {index === 1 && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className={`${getPlanBadgeColor(plan.name)} text-white px-3 py-1`}>
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <span>{getPlanEmoji(plan.name)}</span>
                    {plan.name}
                  </CardTitle>
                  <div className="text-4xl font-bold">
                    {formatPrice(billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly)}
                    <span className="text-lg text-muted-foreground font-normal">
                      /{billingCycle === 'yearly' ? 'year' : 'month'}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">+ ad spend</div>
                  {billingCycle === 'yearly' && (
                    <div className="text-sm text-green-600 font-medium">
                      Save {formatPrice((plan.price_monthly * 12) - plan.price_yearly)} per year
                    </div>
                  )}
                  <div className="mt-2 text-sm text-muted-foreground italic">
                    🔑 {plan.description}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {getFeatures(plan.features).map((feature, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </CardContent>

                <CardFooter>
                  <Button 
                    className="w-full"
                    variant={index === 1 ? "default" : "outline"}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={currentSubscription?.plan_id === plan.id}
                  >
                    {currentSubscription?.plan_id === plan.id ? 'Current Plan' : `Get ${plan.name}`}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubscriptionPlans;