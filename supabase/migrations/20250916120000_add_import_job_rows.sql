-- Create rows table for CSV import idempotency and progress tracking
CREATE TABLE IF NOT EXISTS public.import_job_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_job_id uuid NOT NULL REFERENCES public.import_jobs(id) ON DELETE CASCADE,
  row_hash text NOT NULL,
  row_data jsonb NOT NULL,
  status text CHECK (status IN ('pending','processing','succeeded','failed')) DEFAULT 'pending',
  error_message text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Idempotency per job
CREATE UNIQUE INDEX IF NOT EXISTS idx_import_job_rows_unique_hash ON public.import_job_rows(import_job_id, row_hash);

-- For faster lookups by job
CREATE INDEX IF NOT EXISTS idx_import_job_rows_job ON public.import_job_rows(import_job_id);

-- Enable RLS and policies mirroring import_jobs
ALTER TABLE public.import_job_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Agency members can view import job rows" ON public.import_job_rows
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.import_jobs j
      JOIN public.agencies a ON a.id = j.agency_id
      WHERE j.id = import_job_rows.import_job_id AND is_agency_member(a.id)
    )
  );

CREATE POLICY IF NOT EXISTS "Agency members can manage import job rows" ON public.import_job_rows
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.import_jobs j
      JOIN public.agencies a ON a.id = j.agency_id
      WHERE j.id = import_job_rows.import_job_id AND is_agency_member(a.id)
    )
  );
