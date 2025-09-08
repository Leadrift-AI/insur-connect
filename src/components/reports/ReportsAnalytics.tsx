import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy,
  LineChart,
  Plus,
  Activity,
  Zap
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Import new components and hooks
import { useRealtimeReports } from '@/hooks/useRealtimeReports';
import { FilterOptions } from '@/hooks/useReportsData';
import { KPICards } from './KPICards';
import { ConversionFunnel } from './ConversionFunnel';
import { CampaignROI } from './CampaignROI';
import { AdvancedFilters } from './AdvancedFilters';

interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  deadline: string;
  type: 'policies' | 'revenue' | 'leads';
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#FF8042', '#00C49F', '#FFBB28'];

const chartConfig = {
  roas: {
    label: "ROAS",
    color: "hsl(var(--primary))",
  },
  revenue: {
    label: "Revenue",
    color: "hsl(var(--secondary))",
  },
  spend: {
    label: "Spend",
    color: "hsl(var(--accent))",
  },
};

export const ReportsAnalytics: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState({ title: '', target: '', deadline: '', type: 'policies' as Goal['type'] });
  const [filters, setFilters] = useState<FilterOptions>({ timeRange: '30d' });
  
  const { toast } = useToast();
  
  // Use the new realtime reports hook
  const { 
    reportsData, 
    loading, 
    error, 
    refetch, 
    isRealtime, 
    lastUpdate, 
    toggleRealtime 
  } = useRealtimeReports(filters);

  // Initialize goals
  React.useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    // Mock goals data - in real app this would be stored in database
    const mockGoals: Goal[] = [
      {
        id: '1',
        title: 'Quarterly Policy Sales',
        target: 50,
        current: 32,
        deadline: '2024-03-31',
        type: 'policies'
      },
      {
        id: '2',
        title: 'Monthly Revenue Target',
        target: 50000,
        current: 32500,
        deadline: '2024-01-31',
        type: 'revenue'
      },
      {
        id: '3',
        title: 'Lead Generation Goal',
        target: 200,
        current: 145,
        deadline: '2024-02-15',
        type: 'leads'
      }
    ];
    setGoals(mockGoals);
  };

  const exportToPDF = () => {
    if (!reportsData) return;
    
    // Create PDF document
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Agency Performance Report', 20, 20);
    
    // Add metadata
    doc.setFontSize(12);
    doc.text(`Time Period: ${filters.timeRange.charAt(0).toUpperCase() + filters.timeRange.slice(1)}`, 20, 35);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
    
    // Add KPI section
    doc.setFontSize(14);
    doc.text('Key Performance Indicators', 20, 65);
    
    const kpiData = [
      ['ROAS', `${reportsData.roas.toFixed(1)}x`],
      ['Total Revenue', `$${reportsData.totalRevenue.toLocaleString()}`],
      ['Conversion Rate', `${reportsData.conversionRate}%`],
      ['Total Policies', reportsData.totalPolicies.toString()]
    ];
    
    autoTable(doc, {
      head: [['Metric', 'Value']],
      body: kpiData,
      startY: 75,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    // Add agent performance section
    doc.setFontSize(14);
    doc.text('Agent Performance', 20, (doc as any).lastAutoTable.finalY + 20);
    
    const agentData = reportsData.agentPerformance.map(agent => [
      agent.name,
      agent.leads.toString(),
      agent.policies.toString(),
      `$${agent.revenue.toLocaleString()}`,
      `${agent.conversionRate.toFixed(1)}%`
    ]);
    
    autoTable(doc, {
      head: [['Agent', 'Leads', 'Policies', 'Revenue', 'Conversion Rate']],
      body: agentData,
      startY: (doc as any).lastAutoTable.finalY + 30,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    // Save the PDF
    doc.save(`agency-report-${filters.timeRange}-${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: 'Export Complete',
      description: 'PDF report has been downloaded',
    });
  };

  const exportToCSV = () => {
    if (!reportsData) return;
    
    const csvData = reportsData.agentPerformance.map(agent => ({
      Name: agent.name,
      Leads: agent.leads,
      Policies: agent.policies,
      Revenue: agent.revenue,
      'Conversion Rate': agent.conversionRate + '%'
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agent_performance_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'CSV file has been downloaded',
    });
  };

  const addGoal = () => {
    if (!newGoal.title || !newGoal.target || !newGoal.deadline) return;

    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      target: parseInt(newGoal.target),
      current: 0,
      deadline: newGoal.deadline,
      type: newGoal.type
    };

    setGoals([...goals, goal]);
    setNewGoal({ title: '', target: '', deadline: '', type: 'policies' });
    
    toast({
      title: 'Goal Added',
      description: 'New goal has been created successfully',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Activity className="h-4 w-4 animate-spin" />
            <span>Loading reports...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !reportsData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              {error || 'Failed to load reports data'}
            </p>
            <Button onClick={refetch}>
              <Zap className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
        <p className="text-muted-foreground">Real-time insights and performance tracking for your agency</p>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters
        filters={filters}
        onFiltersChange={setFilters}
        onExportCSV={exportToCSV}
        onExportPDF={exportToPDF}
        onRefresh={refetch}
        isRealtime={isRealtime}
        onToggleRealtime={toggleRealtime}
      />

      {/* KPI Cards */}
      <KPICards 
        data={reportsData} 
        isRealtime={isRealtime} 
        lastUpdate={lastUpdate} 
      />

      {/* Main Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                ROAS Performance Over Time
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Revenue vs Spend tracking with ROAS calculation
              </p>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-80">
                <AreaChart data={reportsData.roasHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="roas" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.1} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Agent Performance Leaderboard
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Top performing agents by policies sold and conversion rate
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportsData.agentPerformance.map((agent, index) => (
                  <div key={agent.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {agent.conversionRate.toFixed(1)}% conversion rate
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-medium">{agent.leads}</p>
                        <p className="text-muted-foreground">Leads</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{agent.policies}</p>
                        <p className="text-muted-foreground">Policies</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">${agent.revenue.toLocaleString()}</p>
                        <p className="text-muted-foreground">Revenue</p>
                      </div>
                      {index < 3 && <Trophy className="h-4 w-4 text-yellow-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel">
          <ConversionFunnel data={reportsData.conversionFunnel} />
        </TabsContent>

        <TabsContent value="campaigns">
          <CampaignROI data={reportsData.campaignROI} />
        </TabsContent>

        <TabsContent value="policies">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Policy Distribution</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Breakdown of policy types sold
                </p>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64">
                  <RechartsPieChart>
                    <Pie
                      data={reportsData.policyTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, percentage }) => `${type}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {reportsData.policyTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RechartsPieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Policy Type</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Revenue breakdown per insurance type
                </p>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64">
                  <BarChart data={reportsData.policyTypes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals">
          <div className="space-y-6">
            {/* Add New Goal */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Goal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="title">Goal Title</Label>
                    <Input
                      id="title"
                      value={newGoal.title}
                      onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                      placeholder="Enter goal title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="target">Target</Label>
                    <Input
                      id="target"
                      type="number"
                      value={newGoal.target}
                      onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                      placeholder="Enter target value"
                    />
                  </div>
                  <div>
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={newGoal.deadline}
                      onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                    />
                  </div>
                  <div className="flex items-end">
                    <Select value={newGoal.type} onValueChange={(value: Goal['type']) => setNewGoal({ ...newGoal, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="policies">Policies</SelectItem>
                        <SelectItem value="revenue">Revenue</SelectItem>
                        <SelectItem value="leads">Leads</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={addGoal} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Goal
                </Button>
              </CardContent>
            </Card>

            {/* Current Goals */}
            <Card>
              <CardHeader>
                <CardTitle>Current Goals</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track your agency's progress towards key objectives
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {goals.map((goal) => {
                    const progress = (goal.current / goal.target) * 100;
                    const isOverdue = new Date(goal.deadline) < new Date();
                    
                    return (
                      <div key={goal.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{goal.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {goal.current} / {goal.target} {goal.type}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={isOverdue ? "destructive" : progress >= 100 ? "default" : "secondary"}>
                              {isOverdue ? "Overdue" : progress >= 100 ? "Complete" : "In Progress"}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              Due: {new Date(goal.deadline).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Progress value={Math.min(progress, 100)} className="h-2" />
                        <p className="text-sm text-muted-foreground mt-1">
                          {progress.toFixed(1)}% complete
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};