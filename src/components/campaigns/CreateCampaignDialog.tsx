import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Link, Target, DollarSign, Users, Globe, Facebook, Linkedin, Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  description: z.string().optional(),
  campaign_type: z.enum(['facebook_ads', 'google_ads', 'linkedin', 'referral', 'website', 'email', 'other']),
  budget: z.coerce.number().min(0).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  target_audience: z.string().optional(),
  campaign_url: z.string().url().optional().or(z.literal('')),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCampaignCreated: () => void;
}

export const CreateCampaignDialog: React.FC<CreateCampaignDialogProps> = ({
  open,
  onOpenChange,
  onCampaignCreated,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      description: '',
      campaign_type: 'facebook_ads',
      budget: 0,
      start_date: '',
      end_date: '',
      target_audience: '',
      campaign_url: '',
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      utm_content: '',
      utm_term: '',
    },
  });

  const watchedCampaignType = form.watch('campaign_type');

  const getCampaignTypeIcon = (type: string) => {
    switch (type) {
      case 'facebook_ads': return <Facebook className="h-4 w-4" />;
      case 'google_ads': return <Globe className="h-4 w-4" />;
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'website': return <Globe className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const onSubmit = async (data: CampaignFormData) => {
    setIsSubmitting(true);
    try {
      // Get current user's agency
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.agency_id) throw new Error('User agency not found');

      // Create campaign
      const { error } = await supabase
        .from('campaigns')
        .insert({
          name: data.name,
          description: data.description || null,
          campaign_type: data.campaign_type,
          agency_id: profile.agency_id,
          budget: data.budget || null,
          start_date: data.start_date || null,
          end_date: data.end_date || null,
          target_audience: data.target_audience || null,
          campaign_url: data.campaign_url || null,
          utm_source: data.utm_source || null,
          utm_medium: data.utm_medium || null,
          utm_campaign: data.utm_campaign || null,
          utm_content: data.utm_content || null,
          utm_term: data.utm_term || null,
        });

      if (error) throw error;

      toast({
        title: 'Campaign Created',
        description: 'Your campaign has been created successfully.',
      });

      onCampaignCreated();
      form.reset();
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to create campaign. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateUTMCampaign = () => {
    const name = form.getValues('name');
    if (name) {
      form.setValue('utm_campaign', name.toLowerCase().replace(/\s+/g, '_'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Create New Campaign
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Campaign Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Q1 Facebook Lead Gen" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your campaign goals and strategy..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="campaign_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select campaign type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="facebook_ads">
                              <div className="flex items-center gap-2">
                                <Facebook className="h-4 w-4" />
                                Facebook Ads
                              </div>
                            </SelectItem>
                            <SelectItem value="google_ads">
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                Google Ads
                              </div>
                            </SelectItem>
                            <SelectItem value="linkedin">
                              <div className="flex items-center gap-2">
                                <Linkedin className="h-4 w-4" />
                                LinkedIn
                              </div>
                            </SelectItem>
                            <SelectItem value="email">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Email Campaign
                              </div>
                            </SelectItem>
                            <SelectItem value="website">
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                Website
                              </div>
                            </SelectItem>
                            <SelectItem value="referral">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Referral Program
                              </div>
                            </SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="end_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Budget & Targeting */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Budget & Targeting
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="target_audience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Audience</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your target audience demographics, interests, etc."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="campaign_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://yourwebsite.com/landing-page"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* UTM Parameters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  UTM Tracking Parameters
                  <Badge variant="outline" className="ml-2">Optional</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track campaign performance with UTM parameters for detailed analytics
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="utm_source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UTM Source</FormLabel>
                        <FormControl>
                          <Input placeholder="facebook" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="utm_medium"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UTM Medium</FormLabel>
                        <FormControl>
                          <Input placeholder="cpc" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="utm_campaign"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UTM Campaign</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input placeholder="lead_generation" {...field} />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={generateUTMCampaign}
                          >
                            Auto
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="utm_content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UTM Content</FormLabel>
                        <FormControl>
                          <Input placeholder="ad_variant_a" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="utm_term"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UTM Term</FormLabel>
                        <FormControl>
                          <Input placeholder="life insurance" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Campaign'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};