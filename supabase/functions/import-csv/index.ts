import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

type CsvRow = Record<string, unknown>;

const textEncoder = new TextEncoder();

const hashRow = async (row: CsvRow): Promise<string> => {
  const json = JSON.stringify(row);
  const data = new TextEncoder().encode(json);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
};

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    const jwt = authHeader?.replace('Bearer ', '') ?? '';
    // Recreate client with auth to honor RLS as the user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${jwt}` } } }
    );

    const body = await req.json();
    const { import_job_id, rows, agency_id } = body as {
      import_job_id: string;
      rows: CsvRow[];
      agency_id?: string;
    };

    if (!import_job_id || !Array.isArray(rows) || rows.length === 0) {
      return new Response(JSON.stringify({ error: 'invalid_body' }), { status: 400 });
    }

    // Verify user can access this job
    const { data: job, error: jobErr } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', import_job_id)
      .single();
    if (jobErr || !job) {
      return new Response(JSON.stringify({ error: 'job_not_found' }), { status: 404 });
    }

    // Prepare row inserts with hashes
    const hashes = await Promise.all(rows.map((r) => hashRow(r)));
    const rowsToInsert = rows.map((r, idx) => ({
      import_job_id,
      row_hash: hashes[idx],
      row_data: r,
      status: 'pending'
    }));

    // Upsert rows idempotently by (import_job_id, row_hash)
    const { error: upsertErr } = await supabase
      .from('import_job_rows')
      .upsert(rowsToInsert, { onConflict: 'import_job_id,row_hash', ignoreDuplicates: true });
    if (upsertErr) {
      return new Response(JSON.stringify({ error: 'upsert_failed', details: upsertErr.message }), { status: 500 });
    }

    // Process each row into leads idempotently
    // Fetch job again to get agency_id
    const jobAgencyId = job.agency_id as string;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as Record<string, unknown>;
      const rowHash = hashes[i];
      try {
        // Determine fields
        const email = String((row.email ?? row.Email ?? '') as string).trim();
        const phone = String((row.phone ?? row.Phone ?? '') as string).trim();
        const firstName = String((row.first_name ?? row.firstName ?? row.FirstName ?? '') as string).trim();
        const lastName = String((row.last_name ?? row.lastName ?? row.LastName ?? '') as string).trim();
        const fullName = String((row.full_name ?? row.FullName ?? `${firstName} ${lastName}`) as string).trim();
        const source = String((row.source ?? row.Source ?? 'import') as string).trim();

        // Skip empty rows
        if (!email && !phone && !fullName) {
          await supabase
            .from('import_job_rows')
            .update({ status: 'failed', error_message: 'Empty row', processed_at: new Date().toISOString() })
            .eq('import_job_id', import_job_id)
            .eq('row_hash', rowHash);
          continue;
        }

        // Check duplicate lead by email or phone within agency
        let exists = false;
        if (email) {
          const { count } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('agency_id', jobAgencyId)
            .eq('email', email);
          exists = (count ?? 0) > 0;
        }
        if (!exists && phone) {
          const { count } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('agency_id', jobAgencyId)
            .eq('phone', phone);
          exists = (count ?? 0) > 0;
        }

        if (!exists) {
          const { error: insertErr } = await supabase
            .from('leads')
            .insert({
              agency_id: jobAgencyId,
              first_name: firstName || null,
              last_name: lastName || null,
              full_name: fullName || null,
              email: email || null,
              phone: phone || null,
              source,
              status: 'new',
            });
          if (insertErr) throw insertErr;
        }

        await supabase
          .from('import_job_rows')
          .update({ status: 'succeeded', processed_at: new Date().toISOString(), error_message: null })
          .eq('import_job_id', import_job_id)
          .eq('row_hash', rowHash);
      } catch (err) {
        await supabase
          .from('import_job_rows')
          .update({ status: 'failed', processed_at: new Date().toISOString(), error_message: (err as Error).message })
          .eq('import_job_id', import_job_id)
          .eq('row_hash', rowHash);
      }
    }

    // Update job totals directly
    const { data: summary, error: summaryErr } = await supabase
      .from('import_job_rows')
      .select('status', { count: 'exact' })
      .eq('import_job_id', import_job_id);
    if (!summaryErr) {
      // Counts aren't grouped; fetch counts manually
      const { count: totalCount } = await supabase
        .from('import_job_rows')
        .select('*', { count: 'exact', head: true })
        .eq('import_job_id', import_job_id);
      const { count: successCount } = await supabase
        .from('import_job_rows')
        .select('*', { count: 'exact', head: true })
        .eq('import_job_id', import_job_id)
        .eq('status', 'succeeded');
      const { count: errorCount } = await supabase
        .from('import_job_rows')
        .select('*', { count: 'exact', head: true })
        .eq('import_job_id', import_job_id)
        .eq('status', 'failed');
      await supabase
        .from('import_jobs')
        .update({ total_rows: totalCount ?? 0, success_rows: successCount ?? 0, error_rows: errorCount ?? 0, status: 'running' })
        .eq('id', import_job_id);
    }

    return new Response(JSON.stringify({ success: true, inserted: rowsToInsert.length }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'server_error', details: (e as Error).message }), { status: 500 });
  }
});

