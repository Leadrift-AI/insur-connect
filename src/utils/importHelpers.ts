import { supabase } from '@/integrations/supabase/client';
import { fetchWithId } from './fetchWithId';

export interface ImportJobStatus {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  total_rows: number;
  processed_rows: number;
  success_count: number;
  error_count: number;
  created_at: string;
  error_details?: unknown[];
}

export interface ImportProgress {
  success: boolean;
  processed: number;
  successCount: number;
  errorCount: number;
  isComplete: boolean;
  totalProcessed: number;
  totalSuccess: number;
  totalErrors: number;
}

export interface ImportChunkRequest {
  importJobId: string;
  csvData: string;
  columnMappings: Record<string, string>;
  chunkIndex?: number;
  totalChunks?: number;
}

export interface InviteUsersRequest {
  emails: string[];
  role: string;
}

export interface InviteUsersResponse {
  success: boolean;
  created: number;
  skipped: number;
  details: {
    createdInvitations: string[];
    alreadyInvited: string[];
    existingUsers: string[];
    seatUsage: string;
  };
}

const getSupabaseUrl = () => {
  return import.meta.env.VITE_SUPABASE_URL || '';
};

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('No authentication token available');
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
};

export const createImportJob = async (
  filename: string,
  totalRows: number
): Promise<ImportJobStatus> => {
  const { data, error } = await supabase
    .from('import_jobs')
    .insert({
      filename,
      total_rows: totalRows,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create import job: ${error.message}`);
  }

  return data;
};

export const processImportChunk = async (
  request: ImportChunkRequest
): Promise<ImportProgress> => {
  const headers = await getAuthHeaders();
  const url = `${getSupabaseUrl()}/functions/v1/import-csv`;

  const response = await fetchWithId(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
};

export const getImportJobStatus = async (jobId: string): Promise<ImportJobStatus> => {
  const { data, error } = await supabase
    .from('import_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch import job: ${error.message}`);
  }

  return data;
};

export const inviteUsers = async (request: InviteUsersRequest): Promise<InviteUsersResponse> => {
  const headers = await getAuthHeaders();
  const url = `${getSupabaseUrl()}/functions/v1/invite-user`;

  const response = await fetchWithId(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
};

export const chunkedImport = async (
  csvData: string,
  columnMappings: Record<string, string>,
  filename: string,
  onProgress?: (progress: ImportProgress) => void,
  chunkSize: number = 1000
): Promise<ImportJobStatus> => {

  // Parse CSV to get total rows
  const lines = csvData.split('\n').filter(line => line.trim());
  const dataLines = lines.slice(1); // Exclude header
  const totalRows = dataLines.length;

  if (totalRows === 0) {
    throw new Error('No data rows found in CSV');
  }

  // Create import job
  const importJob = await createImportJob(filename, totalRows);

  // Calculate chunks
  const totalChunks = Math.ceil(totalRows / chunkSize);
  let allCompleted = false;

  try {
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const startRow = chunkIndex * chunkSize;
      const endRow = Math.min(startRow + chunkSize, totalRows);

      // Create chunk data (include header)
      const chunkLines = [
        lines[0], // Header
        ...dataLines.slice(startRow, endRow)
      ];
      const chunkData = chunkLines.join('\n');

      // Process chunk
      const progress = await processImportChunk({
        importJobId: importJob.id,
        csvData: chunkData,
        columnMappings,
        chunkIndex,
        totalChunks
      });

      // Report progress
      if (onProgress) {
        onProgress(progress);
      }

      // Check if import is complete
      if (progress.isComplete) {
        allCompleted = true;
        break;
      }

      // Small delay between chunks to avoid overwhelming the server
      if (chunkIndex < totalChunks - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Get final status
    const finalStatus = await getImportJobStatus(importJob.id);

    if (!allCompleted && finalStatus.status !== 'completed') {
      throw new Error('Import did not complete successfully');
    }

    return finalStatus;

  } catch (error) {
    // Try to get current status for error details
    try {
      const currentStatus = await getImportJobStatus(importJob.id);
      if (currentStatus.status === 'error') {
        throw new Error(`Import failed: ${currentStatus.error_details}`);
      }
    } catch {
      // Ignore status fetch errors
    }

    throw error;
  }
};

export const downloadErrorReport = (errorDetails: unknown[], filename: string = 'import_errors.csv') => {
  if (!Array.isArray(errorDetails) || errorDetails.length === 0) {
    return;
  }

  const headers = ['Row', 'Error', 'Data'];
  const csvData = [
    headers.join(','),
    ...errorDetails.map((error: any) => {
      const row = error.row || '';
      const message = (error.error || '').replace(/"/g, '""');
      const data = (error.data || '').replace(/"/g, '""');
      return `${row},"${message}","${data}"`;
    })
  ].join('\n');

  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};