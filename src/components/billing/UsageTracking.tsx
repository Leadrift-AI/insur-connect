import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Users, UserCheck, Calendar, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBilling } from '@/hooks/useBilling';

interface UsageTrackingProps {
  usage: any;
  subscription: any;
  onRefresh: () => void;
}

const UsageTracking = ({ usage, subscription, onRefresh }: UsageTrackingProps) => {
  const { updateUsage } = useBilling();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getUsagePercentage = (used: number, limit: number | null) => {
    if (!limit) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const isOverLimit = (used: number, limit: number | null) => {
    if (!limit) return false;
    return used > limit;
  };

  if (!usage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage Tracking</CardTitle>
          <CardDescription>
            No usage data available for this month.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={updateUsage}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Update Usage Data
          </Button>
        </CardContent>
      </Card>
    );
  }

  const plan = subscription?.subscription_plans;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Current Month Usage</CardTitle>
              <CardDescription>
                Usage for {usage.month_year}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={updateUsage}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Update Usage
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Agents Usage */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="font-medium">Active Agents</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{usage.agents_count} agents</span>
                  <span>{plan?.max_agents ? `${plan.max_agents} limit` : 'Unlimited'}</span>
                </div>
                {plan?.max_agents && (
                  <Progress 
                    value={getUsagePercentage(usage.agents_count, plan.max_agents)}
                    className={isOverLimit(usage.agents_count, plan.max_agents) ? "bg-red-100" : ""}
                  />
                )}
                {isOverLimit(usage.agents_count, plan.max_agents) && (
                  <p className="text-sm text-red-600">
                    {usage.agents_count - plan.max_agents} agents over limit
                  </p>
                )}
              </div>
            </div>

            {/* Leads Usage */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                <span className="font-medium">Leads Generated</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{usage.leads_count} leads</span>
                  <span>{plan?.max_leads_per_month ? `${plan.max_leads_per_month} limit` : 'Unlimited'}</span>
                </div>
                {plan?.max_leads_per_month && (
                  <Progress 
                    value={getUsagePercentage(usage.leads_count, plan.max_leads_per_month)}
                    className={isOverLimit(usage.leads_count, plan.max_leads_per_month) ? "bg-red-100" : ""}
                  />
                )}
                {isOverLimit(usage.leads_count, plan.max_leads_per_month) && (
                  <p className="text-sm text-red-600">
                    {usage.leads_count - plan.max_leads_per_month} leads over limit
                  </p>
                )}
              </div>
            </div>

            {/* Appointments */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Appointments</span>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{usage.appointments_count}</div>
                <p className="text-sm text-muted-foreground">This month</p>
              </div>
            </div>
          </div>

          {/* Usage Charges */}
          {usage.total_usage_charges > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Additional Usage Charges</p>
                  <div className="space-y-1 text-sm">
                    {usage.extra_agent_charges > 0 && (
                      <div className="flex justify-between">
                        <span>Extra agents ({usage.agents_count - (plan?.max_agents || 0)} × $15)</span>
                        <span>{formatPrice(usage.extra_agent_charges)}</span>
                      </div>
                    )}
                    {usage.extra_lead_charges > 0 && (
                      <div className="flex justify-between">
                        <span>Extra leads ({usage.leads_count - (plan?.max_leads_per_month || 0)} × $0.50)</span>
                        <span>{formatPrice(usage.extra_lead_charges)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Total Additional Charges</span>
                      <span>{formatPrice(usage.total_usage_charges)}</span>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-muted-foreground">
            <p>Usage is calculated monthly and resets at the beginning of each billing period.</p>
            <p>Additional charges for overage will be added to your next invoice.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsageTracking;