import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Link, Target, DollarSign, Users, Globe, Facebook, Linkedin, Mail, Copy, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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

interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  icon: React.ReactNode;
  defaultValues: Partial<CampaignFormData>;
}

const campaignTemplates: CampaignTemplate[] = [
  {
    id: 'facebook_lead_gen',
    name: 'Facebook Lead Generation',
    description: 'Optimized for capturing leads through Facebook Ads',
    type: 'facebook_ads',
    icon: <Facebook className="h-5 w-5" />,
    defaultValues: {
      campaign_type: 'facebook_ads',
      utm_source: 'facebook',
      utm_medium: 'cpc',
      target_audience: 'Adults 25-55 interested in insurance'
    }
  },
  {
    id: 'google_search',
    name: 'Google Search Ads',
    description: 'Target high-intent keywords on Google Search',
    type: 'google_ads',
    icon: <Globe className="h-5 w-5" />,
    defaultValues: {
      campaign_type: 'google_ads',
      utm_source: 'google',
      utm_medium: 'cpc',
      target_audience: 'People searching for insurance quotes'
    }
  },
  {
    id: 'linkedin_b2b',
    name: 'LinkedIn B2B',
    description: 'Professional targeting for business insurance',
    type: 'linkedin',
    icon: <Linkedin className="h-5 w-5" />,
    defaultValues: {
      campaign_type: 'linkedin',
      utm_source: 'linkedin',
      utm_medium: 'social',
      target_audience: 'Business owners and decision makers'
    }
  },
  {
    id: 'email_nurture',
    name: 'Email Nurture',
    description: 'Automated email sequence for lead nurturing',
    type: 'email',
    icon: <Mail className="h-5 w-5" />,
    defaultValues: {
      campaign_type: 'email',
      utm_source: 'email',
      utm_medium: 'email',
      target_audience: 'Existing leads and prospects'
    }
  }
];

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCampaignCreated: () => void;
  duplicateCampaign?: any;
}

export const CreateCampaignDialog: React.FC<CreateCampaignDialogProps> = ({
  open,
  onOpenChange,
  onCampaignCreated,
  duplicateCampaign
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState('template');
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);
  const { toast } = useToast();

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: duplicateCampaign ? {
      name: `${duplicateCampaign.name} (Copy)`,
      description: duplicateCampaign.description || '',
      campaign_type: duplicateCampaign.campaign_type,
      budget: duplicateCampaign.budget || 0,
      start_date: '',
      end_date: '',
      target_audience: duplicateCampaign.target_audience || '',
      campaign_url: duplicateCampaign.campaign_url || '',
      utm_source: duplicateCampaign.utm_source || '',
      utm_medium: duplicateCampaign.utm_medium || '',
      utm_campaign: '',
      utm_content: duplicateCampaign.utm_content || '',
      utm_term: duplicateCampaign.utm_term || '',
    } : {
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
      resetDialog();
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

  const applyTemplate = (template: CampaignTemplate) => {
    setSelectedTemplate(template);
    Object.entries(template.defaultValues).forEach(([key, value]) => {
      form.setValue(key as keyof CampaignFormData, value as any);
    });
    setCurrentStep('details');
  };

  const generateUTMCampaign = () => {
    const name = form.getValues('name');
    if (name) {
      form.setValue('utm_campaign', name.toLowerCase().replace(/\s+/g, '_'));
    }
  };

  const resetDialog = () => {
    setCurrentStep(duplicateCampaign ? 'details' : 'template');
    setSelectedTemplate(null);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { 
        onOpenChange(open); 
        if (!open) resetDialog(); 
      }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {duplicateCampaign ? <Copy className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
            {duplicateCampaign ? 'Duplicate Campaign' : 'Create New Campaign'}
          </DialogTitle>
        </DialogHeader>

        {!duplicateCampaign && currentStep === 'template' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Choose a Campaign Template</h3>
              <p className="text-muted-foreground">Start with a pre-configured template or create from scratch</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaignTemplates.map((template) => (
                <Card 
                  key={template.id}
                  className="cursor-pointer transition-all hover:shadow-card hover:border-accent/30"
                  onClick={() => applyTemplate(template)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-accent/10 text-accent">
                        {template.icon}
                      </div>
                      {template.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {template.description}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {template.type.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
              
              <Card 
                className="cursor-pointer transition-all hover:shadow-card hover:border-accent/30 border-dashed border-2"
                onClick={() => setCurrentStep('details')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                      <Target className="h-5 w-5" />
                    </div>
                    Start from Scratch
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Create a custom campaign with your own settings
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {(currentStep === 'details' || duplicateCampaign) && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {selectedTemplate && (
                <div className="flex items-center gap-2 p-3 bg-accent/10 rounded-lg">
                  <div className="text-accent">{selectedTemplate.icon}</div>
                  <div>
                    <p className="font-medium text-sm">{selectedTemplate.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedTemplate.description}</p>
                  </div>
                </div>
              )}

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Details</TabsTrigger>
                  <TabsTrigger value="targeting">Targeting & Budget</TabsTrigger>
                  <TabsTrigger value="tracking">UTM Tracking</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Campaign Information
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
                </TabsContent>
                
                <TabsContent value="targeting" className="space-y-4">
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
                </TabsContent>
                
                <TabsContent value="tracking" className="space-y-4">
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
                </TabsContent>
              </Tabs>

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
        )}
      </DialogContent>
    </Dialog>
  );
};