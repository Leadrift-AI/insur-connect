import { seedDemoData, clearAllAgencyData } from './seedData';
import { supabase } from '@/integrations/supabase/client';

interface DevScriptOptions {
  action: 'seed' | 'clear' | 'reset';
  agencyId?: string;
}

export const runDevScript = async ({ action, agencyId }: DevScriptOptions) => {
  try {
    // Get current user's agency if not provided
    let targetAgencyId = agencyId;
    
    if (!targetAgencyId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.agency_id) {
        throw new Error('No agency found for current user');
      }

      targetAgencyId = profile.agency_id;
    }

    console.log(`🚀 Running ${action} script for agency: ${targetAgencyId}`);

    switch (action) {
      case 'clear':
        await clearAllAgencyData(targetAgencyId);
        console.log('✅ All data cleared successfully');
        break;

      case 'seed':
        const results = await seedDemoData({ 
          agencyId: targetAgencyId,
          leadsCount: 50,
          campaignsCount: 5,
          appointmentsCount: 15,
          policiesCount: 8
        });
        console.log('✅ Demo data seeded successfully:', results);
        break;

      case 'reset':
        await clearAllAgencyData(targetAgencyId);
        console.log('✅ Data cleared');
        
        const resetResults = await seedDemoData({ 
          agencyId: targetAgencyId,
          leadsCount: 50,
          campaignsCount: 5,
          appointmentsCount: 15,
          policiesCount: 8
        });
        console.log('✅ Fresh demo data seeded:', resetResults);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return { success: true, agencyId: targetAgencyId };
    
  } catch (error) {
    console.error(`❌ Error running ${action} script:`, error);
    throw error;
  }
};

// Quick access functions for dev console
export const seedData = () => runDevScript({ action: 'seed' });
export const clearData = () => runDevScript({ action: 'clear' });
export const resetData = () => runDevScript({ action: 'reset' });

// Make functions available globally in dev mode
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).devScript = {
    seed: seedData,
    clear: clearData,
    reset: resetData,
    runDevScript
  };
  
  console.log('🛠️ Dev script available! Run window.devScript.seed(), .clear(), or .reset()');
}