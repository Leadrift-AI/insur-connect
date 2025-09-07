import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Target } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Campaign {
  id: string;
  name: string;
  campaign_type: string;
  status: string;
}

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CreateLeadDialog = ({ open, onOpenChange, onSuccess }: CreateLeadDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchCampaigns();
    }
  }, [open]);

  const fetchCampaigns = async () => {
    if (!user) return;
    
    setLoadingCampaigns(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.agency_id) return;

      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, campaign_type, status')
        .eq('agency_id', profile.agency_id)
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const firstName = formData.get('firstName') as string;
      const lastName = formData.get('lastName') as string;
      const email = formData.get('email') as string;
      const phone = formData.get('phone') as string;
      const source = formData.get('source') as string;
      const campaignId = formData.get('campaign') as string;

      // Get user's agency
      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.agency_id) {
        toast({
          title: "Error",
          description: "No agency found. Please contact support.",
          variant: "destructive"
        });
        return;
      }

      // Use the create_lead function
      const { data, error } = await supabase.rpc('create_lead', {
        p_agency_id: profile.agency_id,
        p: {
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone,
          source: source
        }
      });

      if (error) {
        console.error('Error creating lead:', error);
        toast({
          title: "Error",
          description: "Failed to create lead. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // If a campaign was selected, update the lead with campaign info
      if (campaignId && data) {
        const selectedCampaign = campaigns.find(c => c.id === campaignId);
        
        const { error: updateError } = await supabase
          .from('leads')
          .update({ 
            campaign_id: campaignId,
            utm_source: selectedCampaign?.campaign_type || source
          })
          .eq('id', data);

        if (updateError) {
          console.error('Error updating lead with campaign:', updateError);
        }
      }

      toast({
        title: "Success",
        description: "Lead created successfully!"
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating lead:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Lead</DialogTitle>
          <DialogDescription>
            Add a new lead to your pipeline. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="John"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Doe"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john.doe@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source">Lead Source</Label>
            <Select name="source" defaultValue="website">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="facebook">Facebook Ads</SelectItem>
                <SelectItem value="google">Google Ads</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="cold-call">Cold Call</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="campaign">Campaign (Optional)</Label>
            <Select name="campaign">
              <SelectTrigger>
                <SelectValue placeholder={loadingCampaigns ? "Loading campaigns..." : "Select a campaign"} />
              </SelectTrigger>
              <SelectContent>
                {campaigns.length === 0 && !loadingCampaigns ? (
                  <SelectItem value="" disabled>
                    No active campaigns
                  </SelectItem>
                ) : (
                  campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        <span>{campaign.name}</span>
                        <span className="text-xs text-muted-foreground ml-1">
                          ({campaign.campaign_type.replace('_', ' ')})
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Associate this lead with a marketing campaign for better tracking
            </p>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLeadDialog;