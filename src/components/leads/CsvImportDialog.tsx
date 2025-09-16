import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAgency } from '@/hooks/useAgency';
import { Upload } from 'lucide-react';

interface CsvImportDialogProps {
  importJobId?: string;
}

export const CsvImportDialog: React.FC<CsvImportDialogProps> = () => {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();
  const { agencyId } = useAgency();

  const CHUNK_SIZE = 800; // between 500-1000

  const parseCsv = async (file: File): Promise<Record<string, string>[]> => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = (cols[idx] ?? '').trim(); });
      rows.push(row);
    }
    return rows;
  };

  const createImportJob = async (): Promise<string> => {
    if (!agencyId) throw new Error('No agency');
    const { data, error } = await supabase
      .from('import_jobs')
      .insert({ agency_id: agencyId, status: 'running' })
      .select('id')
      .single();
    if (error) throw error;
    return data!.id as string;
  };

  const uploadInChunks = async (rows: Record<string, any>[], importJobId: string) => {
    const total = rows.length;
    let uploaded = 0;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase.functions.invoke('import-csv', {
        body: { import_job_id: importJobId, rows: chunk, agency_id: agencyId },
      });
      if (error) throw error;
      uploaded += chunk.length;
      setProgress(Math.round((uploaded / total) * 100));
    }
  };

  const pollProgress = async (importJobId: string) => {
    // Poll the job and rows summary to reflect progress
    const interval = setInterval(async () => {
      const { data: job } = await supabase
        .from('import_jobs')
        .select('total_rows, success_rows, error_rows, status')
        .eq('id', importJobId)
        .single();
      if (job) {
        const done = (job.success_rows || 0) + (job.error_rows || 0);
        const total = job.total_rows || 0;
        if (total > 0) {
          setProgress(Math.round((done / total) * 100));
        }
        if (job.status === 'succeeded' || job.status === 'failed') {
          clearInterval(interval);
          setLoading(false);
          toast({ title: 'Import complete', description: `Status: ${job.status}` });
        }
      }
    }, 1500);
  };

  const handleFile = async (file: File) => {
    try {
      setLoading(true);
      setProgress(0);
      setOpen(true);
      const rows = await parseCsv(file);
      const id = await createImportJob();
      setJobId(id);
      await uploadInChunks(rows, id);
      await pollProgress(id);
    } catch (e: any) {
      setLoading(false);
      toast({ title: 'Import failed', description: e.message || 'Unexpected error', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          <Upload className="w-4 h-4 mr-2" />
          Import CSV
        </Button>
      </DialogTrigger>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importing Leads</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">{jobId ? `Job: ${jobId}` : 'Preparing...'}</div>
          <Progress value={progress} />
          {loading && <div className="text-sm">Uploading and processing...</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

