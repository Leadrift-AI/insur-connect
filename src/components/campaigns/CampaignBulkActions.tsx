import React, { useState } from 'react';
import { Play, Pause, Trash2, Copy, Download, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CampaignBulkActionsProps {
  selectedCampaigns: string[];
  campaigns: any[];
  onSelectionChange: (selectedIds: string[]) => void;
  onCampaignsChange: () => void;
}

export const CampaignBulkActions: React.FC<CampaignBulkActionsProps> = ({
  selectedCampaigns,
  campaigns,
  onSelectionChange,
  onCampaignsChange
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const selectedCampaignData = campaigns.filter(c => selectedCampaigns.includes(c.id));
  const activeSelected = selectedCampaignData.filter(c => c.status === 'active').length;
  const pausedSelected = selectedCampaignData.filter(c => c.status === 'paused').length;

  const handleBulkStatusUpdate = async (newStatus: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: newStatus })
        .in('id', selectedCampaigns);

      if (error) throw error;

      toast({
        title: 'Campaigns Updated',
        description: `${selectedCampaigns.length} campaigns ${newStatus === 'active' ? 'activated' : 'paused'} successfully.`,
      });

      onCampaignsChange();
      onSelectionChange([]);
    } catch (error) {
      console.error('Error updating campaigns:', error);
      toast({
        title: 'Error',
        description: 'Failed to update campaigns',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .in('id', selectedCampaigns);

      if (error) throw error;

      toast({
        title: 'Campaigns Deleted',
        description: `${selectedCampaigns.length} campaigns deleted successfully.`,
      });

      onCampaignsChange();
      onSelectionChange([]);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting campaigns:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete campaigns',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const exportCampaigns = () => {
    const csvContent = [
      'Name,Type,Status,Budget,Start Date,End Date,Total Leads',
      ...selectedCampaignData.map(campaign => 
        [
          campaign.name,
          campaign.campaign_type,
          campaign.status,
          campaign.budget || 0,
          campaign.start_date || '',
          campaign.end_date || '',
          0 // TODO: Get actual lead count
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campaigns.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Campaign data exported to CSV file.',
    });
  };

  if (selectedCampaigns.length === 0) return null;

  return (
    <div className="flex items-center gap-3 p-4 bg-accent/10 border border-accent/20 rounded-lg">
      <Badge variant="secondary" className="font-medium">
        {selectedCampaigns.length} selected
      </Badge>

      <div className="flex items-center gap-2">
        {pausedSelected > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkStatusUpdate('active')}
            disabled={isProcessing}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            Activate ({pausedSelected})
          </Button>
        )}

        {activeSelected > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkStatusUpdate('paused')}
            disabled={isProcessing}
            className="gap-2"
          >
            <Pause className="h-4 w-4" />
            Pause ({activeSelected})
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2">
              <MoreHorizontal className="h-4 w-4" />
              More Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportCampaigns}>
              <Download className="mr-2 h-4 w-4" />
              Export to CSV
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Campaigns
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onSelectionChange([])}
        >
          Clear Selection
        </Button>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaigns</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCampaigns.length} campaign{selectedCampaigns.length !== 1 ? 's' : ''}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};