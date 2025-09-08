import React, { useState, useEffect, useMemo } from 'react';
import { Edit, Eye, MoreHorizontal, Play, Pause, Trash2, Globe, Facebook, Linkedin, Mail, Users, Target, Copy, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { CampaignFilters } from './CampaignFilters';
import { CampaignBulkActions } from './CampaignBulkActions';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  campaign_type: string;
  status: string;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

interface CampaignsListProps {
  onDuplicateCampaign?: (campaign: Campaign) => void;
}

export const CampaignsList: React.FC<CampaignsListProps> = ({
  onDuplicateCampaign
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 100000]);
  
  const { toast } = useToast();
  const { canManageCampaigns } = useUserRole();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.agency_id) return;

      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('agency_id', profile.agency_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaigns',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCampaignTypeIcon = (type: string) => {
    switch (type) {
      case 'facebook_ads': return <Facebook className="h-4 w-4" />;
      case 'google_ads': return <Globe className="h-4 w-4" />;
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'website': return <Globe className="h-4 w-4" />;
      case 'referral': return <Users className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
      const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           campaign.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
      const matchesType = typeFilter === 'all' || campaign.campaign_type === typeFilter;
      const matchesBudget = !campaign.budget || 
                           (campaign.budget >= budgetRange[0] && campaign.budget <= budgetRange[1]);
      
      return matchesSearch && matchesStatus && matchesType && matchesBudget;
    });
  }, [campaigns, searchQuery, statusFilter, typeFilter, budgetRange]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (statusFilter !== 'all') count++;
    if (typeFilter !== 'all') count++;
    if (budgetRange[0] > 0 || budgetRange[1] < 100000) count++;
    return count;
  }, [searchQuery, statusFilter, typeFilter, budgetRange]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setBudgetRange([0, 100000]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-secondary/20 text-secondary border-secondary/30">Active</Badge>;
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCampaignType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const toggleCampaignStatus = async (campaignId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: newStatus })
        .eq('id', campaignId);

      if (error) throw error;

      setCampaigns(campaigns.map(campaign =>
        campaign.id === campaignId
          ? { ...campaign, status: newStatus }
          : campaign
      ));

      toast({
        title: 'Campaign Updated',
        description: `Campaign ${newStatus === 'active' ? 'activated' : 'paused'} successfully.`,
      });
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to update campaign status',
        variant: 'destructive',
      });
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      setCampaigns(campaigns.filter(campaign => campaign.id !== campaignId));
      toast({
        title: 'Campaign Deleted',
        description: 'Campaign has been deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete campaign',
        variant: 'destructive',
      });
    }
  };

  const handleSelectAll = () => {
    if (selectedCampaigns.length === filteredCampaigns.length) {
      setSelectedCampaigns([]);
    } else {
      setSelectedCampaigns(filteredCampaigns.map(c => c.id));
    }
  };

  const handleSelectCampaign = (campaignId: string) => {
    setSelectedCampaigns(prev => 
      prev.includes(campaignId) 
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading campaigns...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <CampaignFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        budgetRange={budgetRange}
        onBudgetRangeChange={setBudgetRange}
        onClearFilters={clearFilters}
        activeFiltersCount={activeFiltersCount}
      />

      <CampaignBulkActions
        selectedCampaigns={selectedCampaigns}
        campaigns={campaigns}
        onSelectionChange={setSelectedCampaigns}
        onCampaignsChange={fetchCampaigns}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Campaigns ({filteredCampaigns.length})</span>
            {filteredCampaigns.length > 0 && canManageCampaigns && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSelectAll}
                  className="gap-2"
                >
                  {selectedCampaigns.length === filteredCampaigns.length ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  {selectedCampaigns.length === filteredCampaigns.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage and track all your marketing campaigns
          </p>
        </CardHeader>
        <CardContent>
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {campaigns.length === 0 ? 'No campaigns yet' : 'No campaigns match your filters'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {campaigns.length === 0 
                  ? 'Create your first campaign to start tracking your marketing efforts.'
                  : 'Try adjusting your search or filters to find campaigns.'
                }
              </p>
              {activeFiltersCount > 0 && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <Table>
            <TableHeader>
              <TableRow>
                {canManageCampaigns && (
                  <TableHead className="w-[50px]">
                    <input
                      type="checkbox"
                      checked={selectedCampaigns.length === filteredCampaigns.length && filteredCampaigns.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-border"
                    />
                  </TableHead>
                )}
                <TableHead>Campaign</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.id} className={selectedCampaigns.includes(campaign.id) ? 'bg-accent/5' : ''}>
                  {canManageCampaigns && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedCampaigns.includes(campaign.id)}
                        onChange={() => handleSelectCampaign(campaign.id)}
                        className="rounded border-border"
                      />
                    </TableCell>
                  )}
                <TableCell>
                  <div>
                    <div className="font-medium">{campaign.name}</div>
                    {campaign.description && (
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {campaign.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getCampaignTypeIcon(campaign.campaign_type)}
                    <span className="text-sm">{formatCampaignType(campaign.campaign_type)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(campaign.status)}
                </TableCell>
                <TableCell>
                  {campaign.budget ? `$${campaign.budget.toLocaleString()}` : '-'}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {campaign.start_date && (
                      <div>Start: {new Date(campaign.start_date).toLocaleDateString()}</div>
                    )}
                    {campaign.end_date && (
                      <div>End: {new Date(campaign.end_date).toLocaleDateString()}</div>
                    )}
                    {!campaign.start_date && !campaign.end_date && '-'}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {canManageCampaigns && (
                          <>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Campaign
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDuplicateCampaign?.(campaign)}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate Campaign
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toggleCampaignStatus(campaign.id, campaign.status)}
                            >
                              {campaign.status === 'active' ? (
                                <>
                                  <Pause className="mr-2 h-4 w-4" />
                                  Pause Campaign
                                </>
                              ) : (
                                <>
                                  <Play className="mr-2 h-4 w-4" />
                                  Activate Campaign
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteCampaign(campaign.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Campaign
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};