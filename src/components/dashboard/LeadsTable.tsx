import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, RefreshCw, Mail, Phone, Calendar, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import CreateLeadDialog from './CreateLeadDialog';

interface Lead {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  created_at: string;
}

interface LeadsTableProps {
  leads: Lead[];
  onRefresh: () => void;
  loading?: boolean;
  error?: string;
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'new':
      return 'bg-blue-100 text-blue-800';
    case 'contacted':
      return 'bg-yellow-100 text-yellow-800';
    case 'booked':
      return 'bg-purple-100 text-purple-800';
    case 'showed':
      return 'bg-green-100 text-green-800';
    case 'won':
      return 'bg-emerald-100 text-emerald-800';
    case 'lost':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getSourceColor = (source: string) => {
  switch (source?.toLowerCase()) {
    case 'facebook':
      return 'bg-blue-100 text-blue-800';
    case 'google':
      return 'bg-green-100 text-green-800';
    case 'referral':
      return 'bg-purple-100 text-purple-800';
    case 'website':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const LeadsTable = ({ leads, onRefresh, loading = false, error }: LeadsTableProps) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
      toast({
        title: "Leads refreshed",
        description: "Lead data has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Failed to refresh leads",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleAction = (leadId: string, action: string) => {
    toast({
      title: `${action} initiated`,
      description: `Action for lead ${leadId} has been started.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Leads</CardTitle>
            <CardDescription>
              Manage your leads and track their progress through the pipeline
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-8 animate-fade-in">
            <div className="rounded-full bg-destructive/10 p-3 w-fit mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Failed to load leads
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error}
            </p>
            <Button onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Try Again
            </Button>
          </div>
        ) : loading ? (
          <LoadingSpinner text="Loading leads..." />
        ) : leads.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No leads yet"
            description="Create your first lead to get started with your pipeline"
            action={{
              label: "Add Your First Lead",
              onClick: () => setCreateDialogOpen(true)
            }}
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead, index) => (
                  <TableRow 
                    key={lead.id} 
                    className="animate-fade-in hover:bg-muted/50 transition-colors"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <TableCell className="font-medium">{lead.full_name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {lead.email && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Mail className="h-3 w-3 mr-1" />
                            {lead.email}
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Phone className="h-3 w-3 mr-1" />
                            {lead.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status || 'new'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getSourceColor(lead.source)}>
                        {lead.source || 'unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(lead.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleAction(lead.id, 'Schedule appointment')}
                          aria-label={`Schedule appointment with ${lead.full_name}`}
                          className="hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleAction(lead.id, 'Send email')}
                          aria-label={`Send email to ${lead.full_name}`}
                          className="hover:bg-secondary/10 hover:text-secondary transition-colors"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleAction(lead.id, 'Make call')}
                          aria-label={`Call ${lead.full_name}`}
                          className="hover:bg-accent/10 hover:text-accent transition-colors"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <CreateLeadDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          setCreateDialogOpen(false);
          onRefresh();
        }}
      />
    </Card>
  );
};

export default LeadsTable;