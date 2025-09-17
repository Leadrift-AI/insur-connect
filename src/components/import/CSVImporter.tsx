import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAgency } from '@/hooks/useAgency';
import { supabase } from '@/integrations/supabase/client';
import { chunkedImport, downloadErrorReport, ImportJobStatus, ImportProgress } from '@/utils/importHelpers';
import { Upload, FileText, ArrowRightLeft, Eye, CheckCircle, AlertCircle, Download } from 'lucide-react';

// Use the ImportJobStatus type from utils
type ImportJob = ImportJobStatus;

interface ColumnMapping {
  csvColumn: string;
  leadField: string;
}

interface ParsedCSV {
  headers: string[];
  data: Record<string, string>[];
  totalRows: number;
}

const LEAD_FIELDS = [
  { value: 'first_name', label: 'First Name' },
  { value: 'last_name', label: 'Last Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'source', label: 'Source' },
  { value: 'status', label: 'Status' },
  { value: 'notes', label: 'Notes' },
  { value: 'campaign', label: 'Campaign' },
  { value: '', label: 'Skip Column' },
];

const CHUNK_SIZE = 1000;

export default function CSVImporter() {
  const [activeTab, setActiveTab] = useState('upload');
  const [parsedCSV, setParsedCSV] = useState<ParsedCSV | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [importJob, setImportJob] = useState<ImportJob | null>(null);
  const [importing, setImporting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { agencyId } = useAgency();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a CSV file',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());

        if (lines.length === 0) {
          throw new Error('CSV file is empty');
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row: Record<string, string> = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });

        setParsedCSV({
          headers,
          data: data.slice(0, 10), // Preview first 10 rows
          totalRows: data.length,
        });

        // Initialize column mappings
        const initialMappings = headers.map(header => ({
          csvColumn: header,
          leadField: guessFieldMapping(header),
        }));
        setColumnMappings(initialMappings);

        setActiveTab('mapping');
        toast({
          title: 'File uploaded successfully',
          description: `Found ${headers.length} columns and ${data.length} rows`,
        });
      } catch (error) {
        toast({
          title: 'Error parsing CSV',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        });
      }
    };

    reader.readAsText(file);
  };

  const guessFieldMapping = (header: string): string => {
    const normalized = header.toLowerCase().replace(/[^a-z]/g, '');

    if (['firstname', 'fname', 'first'].includes(normalized)) return 'first_name';
    if (['lastname', 'lname', 'last'].includes(normalized)) return 'last_name';
    if (['email', 'emailaddress', 'mail'].includes(normalized)) return 'email';
    if (['phone', 'telephone', 'mobile', 'phonenumber'].includes(normalized)) return 'phone';
    if (['source', 'leadsource', 'origin'].includes(normalized)) return 'source';
    if (['status', 'leadstatus', 'state'].includes(normalized)) return 'status';
    if (['notes', 'comments', 'description'].includes(normalized)) return 'notes';
    if (['campaign', 'campaignname', 'promo'].includes(normalized)) return 'campaign';

    return '';
  };

  const updateColumnMapping = (csvColumn: string, leadField: string) => {
    setColumnMappings(prev =>
      prev.map(mapping =>
        mapping.csvColumn === csvColumn
          ? { ...mapping, leadField }
          : mapping
      )
    );
  };

  const startImport = async () => {
    if (!parsedCSV || !fileInputRef.current?.files?.[0]) return;

    setImporting(true);
    setUploadProgress(0);
    setActiveTab('progress');

    try {
      const file = fileInputRef.current.files[0];
      const csvContent = await file.text();

      // Create column mappings object
      const mappings: Record<string, string> = {};
      columnMappings.forEach(mapping => {
        if (mapping.leadField && mapping.leadField !== '') {
          mappings[mapping.csvColumn] = mapping.leadField;
        }
      });

      // Start chunked import
      const finalJob = await chunkedImport(
        csvContent,
        mappings,
        file.name,
        (progress: ImportProgress) => {
          // Update progress
          setUploadProgress((progress.totalProcessed / parsedCSV.totalRows) * 100);

          // Update job state for UI
          setImportJob(prev => prev ? {
            ...prev,
            processed_rows: progress.totalProcessed,
            success_count: progress.totalSuccess,
            error_count: progress.totalErrors,
            status: progress.isComplete ? 'completed' : 'processing'
          } : null);
        }
      );

      setImportJob(finalJob);

      toast({
        title: 'Import completed',
        description: `Successfully imported ${finalJob.success_count} leads. ${finalJob.error_count} errors.`,
      });

    } catch (error) {
      console.error('Import error:', error);

      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });

      // Update job status to error if we have a job
      if (importJob) {
        setImportJob(prev => prev ? { ...prev, status: 'error' } : null);
      }
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadErrorReport = () => {
    if (importJob?.error_details) {
      downloadErrorReport(importJob.error_details, 'import_errors.csv');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Import Leads</h1>
        <p className="text-muted-foreground">Upload and map your CSV data to import leads</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="mapping" disabled={!parsedCSV}>Mapping</TabsTrigger>
          <TabsTrigger value="preview" disabled={!parsedCSV}>Preview</TabsTrigger>
          <TabsTrigger value="progress" disabled={!importJob}>Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload CSV File
              </CardTitle>
              <CardDescription>
                Select a CSV file to import leads. File should include headers for proper mapping.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="csvFile">CSV File</Label>
                  <Input
                    id="csvFile"
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="mt-1"
                  />
                </div>

                {parsedCSV && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        File parsed successfully
                      </span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      {parsedCSV.headers.length} columns, {parsedCSV.totalRows} rows
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapping">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5" />
                Column Mapping
              </CardTitle>
              <CardDescription>
                Map your CSV columns to lead fields. Unmapped columns will be skipped.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {columnMappings.map((mapping) => (
                  <div key={mapping.csvColumn} className="flex items-center gap-4">
                    <div className="flex-1">
                      <Badge variant="outline">{mapping.csvColumn}</Badge>
                    </div>
                    <div className="flex-1">
                      <Select
                        value={mapping.leadField}
                        onValueChange={(value) => updateColumnMapping(mapping.csvColumn, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field..." />
                        </SelectTrigger>
                        <SelectContent>
                          {LEAD_FIELDS.map((field) => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end">
                  <Button onClick={() => setActiveTab('preview')}>
                    Review Mapping
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Preview Import
              </CardTitle>
              <CardDescription>
                Review the first 10 rows with your column mapping applied.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columnMappings
                        .filter(m => m.leadField)
                        .map(mapping => (
                          <TableHead key={mapping.csvColumn}>
                            {LEAD_FIELDS.find(f => f.value === mapping.leadField)?.label}
                          </TableHead>
                        ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedCSV?.data.slice(0, 10).map((row, index) => (
                      <TableRow key={index}>
                        {columnMappings
                          .filter(m => m.leadField)
                          .map(mapping => (
                            <TableCell key={mapping.csvColumn}>
                              {row[mapping.csvColumn] || '-'}
                            </TableCell>
                          ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab('mapping')}>
                    Back to Mapping
                  </Button>
                  <Button onClick={startImport} disabled={importing}>
                    Start Import ({parsedCSV?.totalRows} rows)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {importJob?.status === 'completed' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : importJob?.status === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
                Import Progress
              </CardTitle>
              <CardDescription>
                {importJob?.status === 'completed'
                  ? 'Import completed successfully'
                  : importJob?.status === 'error'
                  ? 'Import failed with errors'
                  : 'Processing your data...'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>

                {importJob && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {importJob.success_count}
                      </div>
                      <div className="text-sm text-muted-foreground">Successful</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {importJob.error_count}
                      </div>
                      <div className="text-sm text-muted-foreground">Errors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {importJob.processed_rows}
                      </div>
                      <div className="text-sm text-muted-foreground">Processed</div>
                    </div>
                  </div>
                )}

                {importJob?.status === 'completed' && importJob.error_count > 0 && (
                  <div className="flex justify-center">
                    <Button variant="outline" onClick={handleDownloadErrorReport}>
                      <Download className="w-4 h-4 mr-2" />
                      Download Error Report
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}