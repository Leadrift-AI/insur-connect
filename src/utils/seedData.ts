import { supabase } from '@/integrations/supabase/client';

interface SeedDataOptions {
  agencyId: string;
  leadsCount?: number;
  campaignsCount?: number;
  appointmentsCount?: number;
  policiesCount?: number;
}

// Helper function to generate random data
const randomChoice = <T>(array: T[]): T => 
  array[Math.floor(Math.random() * array.length)];

const randomDate = (days: number) => 
  new Date(Date.now() - Math.random() * days * 24 * 60 * 60 * 1000);

const SAMPLE_NAMES = [
  'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'David Wilson',
  'Lisa Anderson', 'James Miller', 'Jennifer Taylor', 'Robert Garcia', 'Mary Rodriguez',
  'William Martinez', 'Elizabeth Lopez', 'Joseph Lee', 'Susan White', 'Thomas Harris',
  'Jessica Clark', 'Charles Lewis', 'Nancy Hall', 'Christopher Allen', 'Karen Young'
];

const SAMPLE_EMAILS = [
  'john.smith@email.com', 'sarah.j@gmail.com', 'mike.brown@outlook.com', 
  'emily.davis@yahoo.com', 'david.w@company.com', 'lisa.anderson@email.com',
  'james.miller@gmail.com', 'jen.taylor@outlook.com', 'robert.g@company.com',
  'mary.rodriguez@email.com', 'william.m@gmail.com', 'liz.lopez@yahoo.com'
];

const SAMPLE_PHONES = [
  '(555) 123-4567', '(555) 234-5678', '(555) 345-6789', '(555) 456-7890',
  '(555) 567-8901', '(555) 678-9012', '(555) 789-0123', '(555) 890-1234'
];

const LEAD_STATUSES = ['new', 'contacted', 'booked', 'showed', 'won', 'lost'];
const LEAD_SOURCES = ['Website', 'Referral', 'Social Media', 'Google Ads', 'Facebook', 'Cold Call'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const CAMPAIGN_TYPES = ['Google Ads', 'Facebook Ads', 'LinkedIn Ads', 'Email Marketing', 'SEO'];
const CAMPAIGN_PLATFORMS = ['Google', 'Facebook', 'LinkedIn', 'Instagram', 'Email'];

const POLICY_TYPES = ['Life Insurance', 'Auto Insurance', 'Home Insurance', 'Health Insurance', 'Disability Insurance'];

export const seedDemoData = async ({ 
  agencyId, 
  leadsCount = 50, 
  campaignsCount = 5, 
  appointmentsCount = 15,
  policiesCount = 8
}: SeedDataOptions) => {
  try {
    console.log('Starting demo data seed...');

    // 1. Seed Campaigns first (needed for lead campaign_id references)
    const campaignInserts = Array.from({ length: campaignsCount }, (_, i) => {
      const budget = Math.floor(Math.random() * 8000) + 2000;
      return {
        agency_id: agencyId,
        name: `${randomChoice(CAMPAIGN_PLATFORMS)} ${randomChoice(CAMPAIGN_TYPES)} Campaign ${i + 1}`,
        campaign_type: randomChoice(CAMPAIGN_TYPES),
        description: `Marketing campaign targeting potential insurance customers through ${randomChoice(CAMPAIGN_PLATFORMS)}`,
        budget,
        status: randomChoice(['active', 'paused', 'completed']),
        utm_source: randomChoice(CAMPAIGN_PLATFORMS).toLowerCase(),
        utm_medium: 'paid',
        utm_campaign: `campaign_${i + 1}`,
        start_date: randomDate(60).toISOString().split('T')[0], // Date only
        end_date: Math.random() > 0.7 ? randomDate(30).toISOString().split('T')[0] : null,
        target_audience: 'Adults 25-65 seeking insurance',
        campaign_url: `https://example.com/campaign-${i + 1}`
      };
    });

    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .insert(campaignInserts)
      .select('id');

    if (campaignsError) {
      console.error('Error seeding campaigns:', campaignsError);
      throw campaignsError;
    }

    console.log(`✅ Created ${campaigns?.length || 0} campaigns`);

    // 2. Seed Leads
    const leadInserts = Array.from({ length: leadsCount }, (_, i) => {
      const fullName = SAMPLE_NAMES[i % SAMPLE_NAMES.length];
      const [firstName, lastName] = fullName.split(' ');
      const email = SAMPLE_EMAILS[i % SAMPLE_EMAILS.length];
      const phone = SAMPLE_PHONES[i % SAMPLE_PHONES.length];
      const source = randomChoice(LEAD_SOURCES);
      const status = randomChoice(LEAD_STATUSES);
      const priority = randomChoice(PRIORITIES);
      const campaignId = campaigns && campaigns.length > 0 ? 
        randomChoice(campaigns).id : null;
      
      return {
        agency_id: agencyId,
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        source,
        status,
        priority,
        campaign_id: campaignId,
        notes: `Lead generated through ${source}. ${status === 'new' ? 'Awaiting first contact.' : `Currently in ${status} stage.`}`,
        utm_source: source.toLowerCase().replace(' ', '_'),
        utm_medium: 'organic',
        created_at: randomDate(90).toISOString()
      };
    });

    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .insert(leadInserts)
      .select('id, full_name, status');

    if (leadsError) {
      console.error('Error seeding leads:', leadsError);
      throw leadsError;
    }

    console.log(`✅ Created ${leads?.length || 0} leads`);

    // 3. Seed Appointments (for leads that are booked or showed)
    const eligibleLeads = leads?.filter(lead => 
      ['booked', 'showed', 'won'].includes(lead.status)
    ) || [];
    
    const appointmentInserts = eligibleLeads.slice(0, appointmentsCount).map((lead, i) => ({
      agency_id: agencyId,
      lead_id: lead.id,
      scheduled_at: randomDate(30).toISOString(),
      status: randomChoice(['scheduled', 'completed', 'cancelled', 'no_show']),
      notes: `Appointment with ${lead.full_name}. ${randomChoice(['Initial consultation', 'Policy review', 'Follow-up meeting', 'Closing meeting'])}`,
      created_at: randomDate(45).toISOString()
    }));

    if (appointmentInserts.length > 0) {
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .insert(appointmentInserts)
        .select('id');

      if (appointmentsError) {
        console.error('Error seeding appointments:', appointmentsError);
        throw appointmentsError;
      }

      console.log(`✅ Created ${appointments?.length || 0} appointments`);
    }

    // 4. Seed Policies (for leads that won)
    const wonLeads = leads?.filter(lead => lead.status === 'won') || [];
    const policyInserts = wonLeads.slice(0, policiesCount).map((lead, i) => {
      const premiumAmount = Math.floor(Math.random() * 3000) + 500;
      const commissionRate = 0.1 + Math.random() * 0.15; // 10-25% commission
      const commissionAmount = premiumAmount * commissionRate;
      
      return {
        agency_id: agencyId,
        lead_id: lead.id,
        policy_number: `POL-${Date.now()}-${i.toString().padStart(3, '0')}`,
        policy_type: randomChoice(POLICY_TYPES),
        premium_amount: premiumAmount,
        commission_amount: commissionAmount,
        status: 'active',
        effective_date: randomDate(60).toISOString().split('T')[0], // Date only
        created_at: randomDate(30).toISOString()
      };
    });

    if (policyInserts.length > 0) {
      const { data: policies, error: policiesError } = await supabase
        .from('policies')
        .insert(policyInserts)
        .select('id');

      if (policiesError) {
        console.error('Error seeding policies:', policiesError);
        throw policiesError;
      }

      console.log(`✅ Created ${policies?.length || 0} policies`);
    }

    console.log('✅ Demo data seed completed successfully!');
    
    return {
      campaigns: campaigns?.length || 0,
      leads: leads?.length || 0,
      appointments: appointmentInserts.length,
      policies: policyInserts.length
    };

  } catch (error) {
    console.error('Error seeding demo data:', error);
    throw error;
  }
};

// Helper function for development use
export const clearAllAgencyData = async (agencyId: string) => {
  try {
    console.log('🧹 Clearing all agency data...');
    
    // Delete in reverse dependency order
    await supabase.from('policies').delete().eq('agency_id', agencyId);
    await supabase.from('appointments').delete().eq('agency_id', agencyId);
    await supabase.from('leads').delete().eq('agency_id', agencyId);
    await supabase.from('campaigns').delete().eq('agency_id', agencyId);
    
    console.log('✅ All agency data cleared');
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
};