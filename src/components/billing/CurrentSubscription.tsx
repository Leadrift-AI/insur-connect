import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CreditCard, RefreshCw } from 'lucide-react';
import { useBilling } from '@/hooks/useBilling';

interface CurrentSubscriptionProps {
  subscription: any;
  onRefresh: () => void;
}

const CurrentSubscription = ({ subscription, onRefresh }: CurrentSubscriptionProps) => {
  const { manageBilling } = useBilling();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      past_due: "destructive",
      canceled: "secondary",
      incomplete: "outline"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>
            You don't have an active subscription yet. Choose a plan to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Subscribe to unlock premium features and expand your agency's capabilities.
          </p>
        </CardContent>
      </Card>
    );
  }

  const plan = subscription.subscription_plans;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                {plan.name} Plan
                {getStatusBadge(subscription.status)}
              </CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </div>
            <Button variant="outline" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span className="font-medium">Billing Cycle</span>
              </div>
              <p className="text-2xl font-bold">
                {formatPrice(
                  subscription.billing_cycle === 'yearly' 
                    ? plan.price_yearly 
                    : plan.price_monthly
                )}
                <span className="text-sm text-muted-foreground font-normal">
                  /{subscription.billing_cycle === 'yearly' ? 'year' : 'month'}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                Billing cycle: {subscription.billing_cycle}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Next Billing Date</span>
              </div>
              <p className="text-lg font-semibold">
                {formatDate(subscription.current_period_end)}
              </p>
              <p className="text-sm text-muted-foreground">
                Current period: {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-3">Plan Features</h4>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="text-sm">
                <span className="font-medium">Max Agents: </span>
                {plan.max_agents ? plan.max_agents.toLocaleString() : 'Unlimited'}
              </div>
              <div className="text-sm">
                <span className="font-medium">Max Leads/Month: </span>
                {plan.max_leads_per_month ? plan.max_leads_per_month.toLocaleString() : 'Unlimited'}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={manageBilling}>
              Manage Billing
            </Button>
            <Button variant="outline" onClick={onRefresh}>
              Update Subscription
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CurrentSubscription;