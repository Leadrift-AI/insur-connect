import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { LeadKanban } from '@/components/leads/LeadKanban';
import LeadsTable from '@/components/dashboard/LeadsTable';
import CreateLeadDialog from '@/components/dashboard/CreateLeadDialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Kanban, Table } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const LeadsPipeline = () => {
  const { user, loading: authLoading } = useAuth();
  const { isReadOnly, loading: roleLoading, canManageLeads } = useUserRole();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleRefresh = () => {
    // This will trigger refresh in both views
    window.location.reload();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Lead Pipeline</h1>
            <p className="text-muted-foreground">
              Manage and track your leads through the sales pipeline
            </p>
          </div>
          
          {canManageLeads && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Lead
            </Button>
          )}
        </div>

        <Tabs defaultValue="kanban" className="w-full">
          <TabsList>
            <TabsTrigger value="kanban" className="flex items-center gap-2">
              <Kanban className="h-4 w-4" />
              Kanban View
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <Table className="h-4 w-4" />
              Table View
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="kanban" className="space-y-6">
            <LeadKanban onRefresh={handleRefresh} />
          </TabsContent>
          
          <TabsContent value="table" className="space-y-6">
            <LeadsTable leads={[]} onRefresh={handleRefresh} loading={false} />
          </TabsContent>
        </Tabs>

        <CreateLeadDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={handleRefresh}
        />
      </div>
    </DashboardLayout>
  );
};

export default LeadsPipeline;