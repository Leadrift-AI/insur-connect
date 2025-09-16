// Deno / Supabase Edge
// Accepts: { import_job_id: string, rows: Array<Record<string, any>> }
// Inserts leads in chunks, server-adds agency_id, updates import_jobs progress,
// idempotent via (import_job_id, row_hash) in import_job_items.

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as Sentry from "npm:@sentry/deno@8";

Sentry.init({ dsn: Deno.env.get("SENTRY_DSN") ?? undefined });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE")!; // keep ONLY in Supabase Function Secrets

type Payload = {
  import_job_id: string;
  rows: Array<Record<string, any>>;
};

const CHUNK = 500;

function toHash(obj: unknown): Promise<string> {
  const str = JSON.stringify(obj);
  const data = new TextEncoder().encode(str);
  return crypto.subtle.digest("SHA-256", data).then((b) =>
    Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("")
  );
}

export const handler = async (req: Request) => {
  const requestId = crypto.randomUUID();
  const start = performance.now();

  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const payload = (await req.json()) as Payload;
    if (!payload?.import_job_id || !Array.isArray(payload.rows)) {
      return new Response("Bad Request", { status: 400 });
    }

    // Authn with user's JWT to know who is calling
    const supaUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: auth } = await supaUser.auth.getUser();
    if (!auth?.user) return new Response("Unauthorized", { status: 401 });

    // Admin client for bulk inserts (RLS bypass, we set agency_id explicitly)
    const supaAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Resolve agency_id from profiles table
    const { data: profile, error: profErr } = await supaAdmin
      .from("profiles")
      .select("agency_id")
      .eq("user_id", auth.user.id)
      .single();

    if (profErr || !profile?.agency_id) return new Response("No agency", { status: 403 });
    const agency_id = profile.agency_id as string;

    // Mark job running
    await supaAdmin
      .from("import_jobs")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("id", payload.import_job_id);

    // Compute hashes + write to import_job_items (dedupe)
    const items = await Promise.all(
      payload.rows.map(async (r) => ({
        import_job_id: payload.import_job_id,
        row_hash: await toHash(r),
        row: r,
      }))
    );

    // Insert hashes (ignore conflicts)
    const { error: itemErr } = await supaAdmin
      .from("import_job_items")
      .insert(items.map(({ import_job_id, row_hash }) => ({ import_job_id, row_hash })), { defaultToNull: true })
      .maybeSingle(); // avoids payload-too-large response noise; conflicts are fine

    if (itemErr && itemErr.code !== "23505") throw itemErr;

    // Fetch only not-yet-inserted items
    const { data: toInsert } = await supaAdmin
      .from("import_job_items")
      .select("row_hash")
      .eq("import_job_id", payload.import_job_id)
      .is("inserted", false);

    const needed = new Set((toInsert ?? []).map((x) => x.row_hash));
    const rows = items.filter((x) => needed.has(x.row_hash)).map((x) => x.row);

    let ok = 0;
    let fail = 0;

    for (let i = 0; i < rows.length; i += CHUNK) {
      const batch = rows.slice(i, i + CHUNK).map((r) => ({
        agency_id,
        // map fields from CSV to DB columns here
        full_name: r.full_name ?? `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim(),
        first_name: r.first_name ?? null,
        last_name: r.last_name ?? null,
        email: r.email ?? null,
        phone: r.phone ?? null,
        source: r.source ?? "CSV",
        status: r.status ?? "new",
        notes: r.notes ?? null,
        campaign_id: r.campaign_id ?? null,
        created_at: r.created_at ?? new Date().toISOString(),
      }));

      const { error } = await supaAdmin.from("leads").insert(batch, { returning: "minimal" });
      if (error) {
        fail += batch.length;
        // mark failures
        const failedHashes = items
          .slice(i, i + CHUNK)
          .filter((x) => needed.has(x.row_hash))
          .map((x) => x.row_hash);
        await supaAdmin
          .from("import_job_items")
          .update({ error: error.message })
          .in("row_hash", failedHashes)
          .eq("import_job_id", payload.import_job_id);
      } else {
        ok += batch.length;
        // mark inserted
        const insertedHashes = items
          .slice(i, i + CHUNK)
          .filter((x) => needed.has(x.row_hash))
          .map((x) => x.row_hash);
        await supaAdmin
          .from("import_job_items")
          .update({ inserted: true, error: null })
          .in("row_hash", insertedHashes)
          .eq("import_job_id", payload.import_job_id);
      }

      // lightweight progress
      await supaAdmin
        .from("import_jobs")
        .update({ processed: ok + fail })
        .eq("id", payload.import_job_id);
    }

    // Finish job
    await supaAdmin
      .from("import_jobs")
      .update({
        status: fail > 0 ? "completed_with_errors" : "succeeded",
        finished_at: new Date().toISOString(),
        success_count: ok,
        error_count: fail,
      })
      .eq("id", payload.import_job_id);

    return Response.json({ ok, fail, total: items.length, requestId });
  } catch (err) {
    Sentry.captureException(err);
    return new Response("Import failed", { status: 500 });
  } finally {
    Sentry.addBreadcrumb({
      category: "import-csv",
      level: "info",
      data: { requestId, ms: Math.round(performance.now() - start) },
    });
  }
};

Deno.serve(handler);
