import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
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
  const [loading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { user } = useAuth();
  const { toast } = useToast();

  // Hardcoded plans matching the sprint requirements
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Great for small agencies',
      price_monthly: 3000, // $30.00
      price_yearly: 32400, // $324.00 (10% discount)
      stripePriceId: 'price_starter_monthly',
      popular: true,
      features: [
        'Up to 500 leads/month',
        'Google Calendar sync',
        'Advanced reporting', 
        'CSV/PDF exports',
        'Priority support',
        'Up to 5 users'
      ]
    },
    {
      id: 'professional',
      name: 'Professional', 
      description: 'Best for growing agencies',
      price_monthly: 5000, // $50.00
      price_yearly: 54000, // $540.00 (10% discount)
      stripePriceId: 'price_professional_monthly',
      features: [
        'Up to 2,000 leads/month',
        'All Starter features',
        'Custom integrations',
        'Advanced analytics',
        'API access',
        'Up to 15 users'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large scale operations',
      price_monthly: 7000, // $70.00
      price_yearly: 75600, // $756.00 (10% discount)
      stripePriceId: 'price_enterprise_monthly',
      features: [
        'Unlimited leads',
        'All Professional features',
        'White-label options',
        'Dedicated support',
        'Custom onboarding',
        'Unlimited users'
      ]
    }
  ];

  const handleSubscribe = async (plan: any) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to subscribe to a plan',
        variant: 'destructive',
      });
      return;
    }


    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: plan.stripePriceId,
          planId: plan.id
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: 'Checkout Error',
        description: 'Failed to create checkout session. Please try again.',
        variant: 'destructive',
      });
    }
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
              <Card key={plan.id} className={`relative border-2 ${getPlanVariant(plan.name)} ${index === 0 ? 'shadow-lg scale-105' : ''}`}>
                {index === 0 && (
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
                    variant={index === 0 ? "default" : "outline"}
                    onClick={() => handleSubscribe(plan)}
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