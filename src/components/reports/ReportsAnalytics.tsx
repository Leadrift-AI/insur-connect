import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  DollarSign, 
  FileText,
  Download,
  Trophy,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  Plus
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
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportsData {
  roas: number;
  totalRevenue: number;
  totalSpend: number;
  conversionRate: number;
  totalLeads: number;
  totalPolicies: number;
  roasHistory: Array<{
    date: string;
    roas: number;
    revenue: number;
    spend: number;
  }>;
  agentPerformance: Array<{
    name: string;
    leads: number;
    policies: number;
    revenue: number;
    conversionRate: number;
  }>;
  policyTypes: Array<{
    type: string;
    count: number;
    revenue: number;
    color: string;
  }>;
}

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
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [newGoal, setNewGoal] = useState({ title: '', target: '', deadline: '', type: 'policies' as Goal['type'] });
  const { toast } = useToast();

  useEffect(() => {
    fetchReportsData();
    fetchGoals();
  }, [timeRange]);

  const fetchReportsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.agency_id) return;

      // Fetch leads and campaigns data
      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .eq('agency_id', profile.agency_id);

      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('*')
        .eq('agency_id', profile.agency_id);

      // Mock data for demonstration - in real app this would come from actual metrics
      const mockReportsData: ReportsData = {
        roas: 4.2,
        totalRevenue: 125000,
        totalSpend: 29800,
        conversionRate: 12.5,
        totalLeads: leads?.length || 0,
        totalPolicies: Math.floor((leads?.length || 0) * 0.125),
        roasHistory: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          roas: 3.5 + Math.random() * 1.5,
          revenue: 3000 + Math.random() * 2000,
          spend: 800 + Math.random() * 400,
        })),
        agentPerformance: [
          { name: 'Sarah Johnson', leads: 45, policies: 12, revenue: 18500, conversionRate: 26.7 },
          { name: 'Mike Chen', leads: 38, policies: 9, revenue: 15200, conversionRate: 23.7 },
          { name: 'Emma Davis', leads: 42, policies: 8, revenue: 14100, conversionRate: 19.0 },
          { name: 'Alex Rodriguez', leads: 35, policies: 7, revenue: 12800, conversionRate: 20.0 },
          { name: 'Lisa Wang', leads: 28, policies: 6, revenue: 11200, conversionRate: 21.4 },
        ],
        policyTypes: [
          { type: 'Auto Insurance', count: 18, revenue: 35000, color: COLORS[0] },
          { type: 'Home Insurance', count: 12, revenue: 28000, color: COLORS[1] },
          { type: 'Life Insurance', count: 8, revenue: 42000, color: COLORS[2] },
          { type: 'Health Insurance', count: 6, revenue: 15000, color: COLORS[3] },
          { type: 'Business Insurance', count: 4, revenue: 5000, color: COLORS[4] },
        ],
      };

      setReportsData(mockReportsData);
    } catch (error) {
      console.error('Error fetching reports data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reports data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
    doc.text(`Time Period: ${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}`, 20, 35);
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
    doc.save(`agency-report-${timeRange}-${new Date().toISOString().split('T')[0]}.pdf`);
    
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

  if (loading || !reportsData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading reports...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Export Options */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reports & Analytics</h2>
          <p className="text-muted-foreground">Real-time insights and performance tracking</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" onClick={exportToPDF}>
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROAS</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportsData.roas.toFixed(1)}x</div>
            <p className="text-xs text-muted-foreground">
              Return on Ad Spend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${reportsData.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportsData.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Lead to policy conversion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportsData.totalPolicies}</div>
            <p className="text-xs text-muted-foreground">
              Sold this period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <Tabs defaultValue="roas" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="roas">ROAS Trend</TabsTrigger>
          <TabsTrigger value="agents">Agent Leaderboard</TabsTrigger>
          <TabsTrigger value="policies">Policy Sales</TabsTrigger>
          <TabsTrigger value="goals">Goal Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="roas">
          <Card>
            <CardHeader>
              <CardTitle>ROAS Performance Over Time</CardTitle>
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
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance Leaderboard</CardTitle>
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

        <TabsContent value="policies">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Policy Sales by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64">
                  <RechartsPieChart>
                    <Pie
                      data={reportsData.policyTypes}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ name, value }) => `${name}: ${value}`}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Goals</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track progress towards your targets
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {goals.map((goal) => (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{goal.title}</p>
                        <Badge variant="outline">
                          {Math.round((goal.current / goal.target) * 100)}%
                        </Badge>
                      </div>
                      <Progress value={(goal.current / goal.target) * 100} className="h-2" />
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{goal.current} / {goal.target} {goal.type}</span>
                        <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add New Goal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="goal-title">Goal Title</Label>
                  <Input
                    id="goal-title"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    placeholder="e.g., Quarterly Sales Target"
                  />
                </div>
                <div>
                  <Label htmlFor="goal-target">Target</Label>
                  <Input
                    id="goal-target"
                    type="number"
                    value={newGoal.target}
                    onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                    placeholder="e.g., 100"
                  />
                </div>
                <div>
                  <Label htmlFor="goal-type">Goal Type</Label>
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
                <div>
                  <Label htmlFor="goal-deadline">Deadline</Label>
                  <Input
                    id="goal-deadline"
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  />
                </div>
                <Button onClick={addGoal} className="w-full">
                  Add Goal
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};