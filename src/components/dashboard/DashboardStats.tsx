import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon, Calendar, DollarSign, Target, TrendingUp, Users } from 'lucide-react';

interface KPIs {
  newLeads: number;
  appointments: number;
  conversionRate: number;
  policiesSold: number;
  commissions: number;
  averageDealSize: number;
}

interface DashboardStatsProps {
  kpis: KPIs;
}

const DashboardStats = ({ kpis }: DashboardStatsProps) => {
  const stats = [
    {
      title: 'New Leads',
      value: kpis.newLeads.toString(),
      icon: Users,
      change: '+12%',
      changeType: 'positive' as const,
      description: 'vs last month'
    },
    {
      title: 'Appointments',
      value: kpis.appointments.toString(),
      icon: Calendar,
      change: '+8%',
      changeType: 'positive' as const,
      description: 'vs last month'
    },
    {
      title: 'Conversion Rate',
      value: `${kpis.conversionRate}%`,
      icon: TrendingUp,
      change: '+3%',
      changeType: 'positive' as const,
      description: 'vs last month'
    },
    {
      title: 'Policies Sold',
      value: kpis.policiesSold.toString(),
      icon: Target,
      change: '+15%',
      changeType: 'positive' as const,
      description: 'vs last month'
    },
    {
      title: 'Commissions',
      value: `$${kpis.commissions.toLocaleString()}`,
      icon: DollarSign,
      change: '+18%',
      changeType: 'positive' as const,
      description: 'vs last month'
    },
    {
      title: 'Avg Deal Size',
      value: `$${kpis.averageDealSize.toLocaleString()}`,
      icon: DollarSign,
      change: '+5%',
      changeType: 'positive' as const,
      description: 'vs last month'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, index) => (
        <Card 
          key={stat.title} 
          className="group transition-all duration-300 hover:shadow-elegant hover:-translate-y-1 animate-fade-in-up cursor-pointer"
          style={{ animationDelay: `${index * 0.1}s` }}
          role="article"
          aria-labelledby={`stat-${stat.title.replace(/\s+/g, '-').toLowerCase()}`}
          tabIndex={0}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle 
              id={`stat-${stat.title.replace(/\s+/g, '-').toLowerCase()}`}
              className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground"
            >
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:text-primary group-hover:scale-110" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary transition-colors group-hover:text-secondary">
              {stat.value}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1 transition-colors group-hover:text-foreground">
              {stat.changeType === 'positive' ? (
                <ArrowUpIcon className="h-3 w-3 text-secondary mr-1 transition-transform group-hover:animate-bounce-subtle" />
              ) : (
                <ArrowDownIcon className="h-3 w-3 text-destructive mr-1" />
              )}
              <span className={stat.changeType === 'positive' ? 'text-secondary' : 'text-destructive'}>
                {stat.change}
              </span>
              <span className="ml-1">{stat.description}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;