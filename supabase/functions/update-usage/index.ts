import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPDATE-USAGE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get user's agency
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.agency_id) {
      throw new Error("No agency found for user");
    }

    const currentDate = new Date();
    const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    // Count agents
    const { count: agentCount } = await supabase
      .from('agency_members')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', profile.agency_id);

    // Count leads for current month
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const { count: leadCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', profile.agency_id)
      .gte('created_at', startOfMonth.toISOString());

    // Count appointments for current month
    const { count: appointmentCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', profile.agency_id)
      .gte('created_at', startOfMonth.toISOString());

    // Get current subscription plan
    const { data: subscription } = await supabase
      .from('agency_subscriptions')
      .select(`
        *,
        subscription_plans!inner(*)
      `)
      .eq('agency_id', profile.agency_id)
      .eq('status', 'active')
      .single();

    let extraAgentCharges = 0;
    let extraLeadCharges = 0;

    if (subscription) {
      const plan = subscription.subscription_plans;
      
      // Calculate extra agent charges
      if (plan.max_agents && agentCount > plan.max_agents) {
        extraAgentCharges = (agentCount - plan.max_agents) * 15; // $15 per extra agent
      }

      // Calculate extra lead charges
      if (plan.max_leads_per_month && leadCount > plan.max_leads_per_month) {
        extraLeadCharges = (leadCount - plan.max_leads_per_month) * 0.50; // $0.50 per extra lead
      }
    }

    const totalUsageCharges = extraAgentCharges + extraLeadCharges;

    // Upsert usage tracking
    const { data: usage, error: usageError } = await supabase
      .from('usage_tracking')
      .upsert({
        agency_id: profile.agency_id,
        month_year: monthYear,
        agents_count: agentCount || 0,
        leads_count: leadCount || 0,
        appointments_count: appointmentCount || 0,
        extra_agent_charges: extraAgentCharges,
        extra_lead_charges: extraLeadCharges,
        total_usage_charges: totalUsageCharges
      }, {
        onConflict: 'agency_id,month_year'
      })
      .select()
      .single();

    if (usageError) {
      throw new Error(`Failed to update usage: ${usageError.message}`);
    }

    logStep("Usage updated successfully", {
      monthYear,
      agents: agentCount,
      leads: leadCount,
      appointments: appointmentCount,
      extraCharges: totalUsageCharges
    });

    return new Response(JSON.stringify({
      success: true,
      usage: {
        agents_count: agentCount || 0,
        leads_count: leadCount || 0,
        appointments_count: appointmentCount || 0,
        extra_agent_charges: extraAgentCharges,
        extra_lead_charges: extraLeadCharges,
        total_usage_charges: totalUsageCharges
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in update-usage", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});