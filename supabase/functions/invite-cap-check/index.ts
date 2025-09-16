import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

serve(async (req) => {
  try {
    if (req.method !== 'GET' && req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    const url = new URL(req.url);
    let agencyId = url.searchParams.get('agency_id');
    if (!agencyId && req.method === 'POST') {
      try {
        const body = await req.json();
        agencyId = body?.agency_id ?? null;
      } catch {}
    }
    if (!agencyId) return new Response(JSON.stringify({ error: 'missing_agency_id' }), { status: 400 });

    const authHeader = req.headers.get('Authorization');
    const jwt = authHeader?.replace('Bearer ', '') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${jwt}` } } }
    );

    // Read plan and seats
    const { data: agency, error: agencyErr } = await supabase
      .from('agencies')
      .select('id, plan, seats')
      .eq('id', agencyId)
      .single();
    if (agencyErr || !agency) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });

    // Count active members
    const { count: memberCount } = await supabase
      .from('agency_members')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agencyId);

    // Count pending invites
    const nowIso = new Date().toISOString();
    const { count: pendingCount } = await supabase
      .from('user_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .is('accepted_at', null)
      .gt('expires_at', nowIso);

    const used = (memberCount ?? 0) + (pendingCount ?? 0);
    const cap = Math.max(agency.seats ?? 1, 1);
    const allowed = used < cap;

    return new Response(JSON.stringify({ allowed, used, cap }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'server_error', details: (e as Error).message }), { status: 500 });
  }
});

