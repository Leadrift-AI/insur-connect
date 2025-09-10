import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MoreHorizontal, Phone, Mail, Calendar, DollarSign, User } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAgency } from '@/hooks/useAgency';
import { useToast } from '@/hooks/use-toast';

interface Lead {
  id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  status: string;
  source?: string;
  priority: string;
  notes?: string;
  created_at: string;
  assigned_agent_id?: string;
}

interface LeadKanbanProps {
  onRefresh?: () => void;
}

const STATUSES = [
  { id: 'new', label: 'New', color: 'bg-blue-500' },
  { id: 'contacted', label: 'Contacted', color: 'bg-yellow-500' },
  { id: 'booked', label: 'Appointment Booked', color: 'bg-purple-500' },
  { id: 'showed', label: 'Showed Up', color: 'bg-green-500' },
  { id: 'won', label: 'Policy Sold', color: 'bg-emerald-600' },
  { id: 'lost', label: 'Lost', color: 'bg-red-500' }
];

const PRIORITY_COLORS = {
  low: 'bg-gray-500',
  medium: 'bg-blue-500', 
  high: 'bg-orange-500',
  urgent: 'bg-red-600'
};

export const LeadKanban = ({ onRefresh }: LeadKanbanProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const { agencyId } = useAgency();
  const { toast } = useToast();

  const fetchLeads = async () => {
    if (!agencyId) return;
    
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch leads',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [agencyId]);

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', leadId);

      if (error) throw error;

      // Update local state
      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));

      toast({
        title: 'Success',
        description: 'Lead status updated successfully'
      });

      onRefresh?.();
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update lead status',
        variant: 'destructive'
      });
    }
  };

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedLead && draggedLead.status !== newStatus) {
      updateLeadStatus(draggedLead.id, newStatus);
    }
    setDraggedLead(null);
  };

  const getLeadsByStatus = (status: string) => {
    return leads.filter(lead => lead.status === status);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
  };

  const handleAction = async (lead: Lead, action: string) => {
    toast({
      title: 'Action Initiated',
      description: `${action} action started for ${lead.full_name}`
    });
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading leads...</div>;
  }

  return (
    <div className="flex gap-6 overflow-x-auto pb-6">
      {STATUSES.map(status => {
        const statusLeads = getLeadsByStatus(status.id);
        return (
          <div key={status.id} className="min-w-80 flex-shrink-0">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{status.label}</h3>
                <Badge variant="secondary" className="ml-2">
                  {statusLeads.length}
                </Badge>
              </div>
              <div className={`h-1 w-full rounded-full ${status.color} mt-2`} />
            </div>
            
            <div 
              className="min-h-[500px] space-y-3"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status.id)}
            >
              {statusLeads.map(lead => (
                <Card
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead)}
                  className="cursor-move hover:shadow-lg transition-shadow duration-200 border border-border/50"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(lead.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base font-medium">
                            {lead.full_name || 'Unknown Lead'}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(lead.created_at)}
                          </p>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleAction(lead, 'Call')}>
                            <Phone className="mr-2 h-4 w-4" />
                            Call Lead
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction(lead, 'Email')}>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction(lead, 'Schedule')}>
                            <Calendar className="mr-2 h-4 w-4" />
                            Schedule Appointment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {lead.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </div>
                      )}
                      
                      {lead.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </div>
                      )}
                      
                      {lead.source && (
                        <Badge variant="outline" className="text-xs">
                          {lead.source}
                        </Badge>
                      )}
                      
                      {lead.priority && lead.priority !== 'medium' && (
                        <Badge 
                          variant="secondary"
                          className={`text-xs ${PRIORITY_COLORS[lead.priority as keyof typeof PRIORITY_COLORS]} text-white`}
                        >
                          {lead.priority.toUpperCase()}
                        </Badge>
                      )}
                      
                      {lead.notes && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {lead.notes}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {statusLeads.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  No leads in {status.label.toLowerCase()}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};