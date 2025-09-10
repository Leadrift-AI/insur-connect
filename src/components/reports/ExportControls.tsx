import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Table, Loader2 } from 'lucide-react';
import { exportToCSV, exportToPDF } from '@/utils/exportHelpers';
import { useAgency } from '@/hooks/useAgency';
import { useToast } from '@/hooks/use-toast';
import { usePlanGating } from '@/hooks/usePlanGating';
import { useState } from 'react';

interface ExportControlsProps {
  data: any[];
  title: string;
  filename: string;
  headers?: string[];
  disabled?: boolean;
}

export const ExportControls = ({ 
  data, 
  title, 
  filename, 
  headers,
  disabled = false 
}: ExportControlsProps) => {
  const { agency } = useAgency();
  const { toast } = useToast();
  const { requiresPaidPlan } = usePlanGating();
  const [exporting, setExporting] = useState({ csv: false, pdf: false });
  
  const exportGating = requiresPaidPlan('export');

  const handleCSVExport = async () => {
    if (!exportGating.allowed) {
      toast({
        title: 'Upgrade Required',
        description: exportGating.upgradeMessage,
        variant: 'destructive'
      });
      return;
    }

    try {
      setExporting({ csv: true, pdf: false });
      
      if (!data || data.length === 0) {
        toast({
          title: 'No Data',
          description: 'No data available to export',
          variant: 'destructive'
        });
        return;
      }

      await exportToCSV(data, filename, headers);
      
      toast({
        title: 'Export Successful',
        description: `${title} exported to CSV successfully`
      });
    } catch (error) {
      console.error('CSV export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export CSV file',
        variant: 'destructive'
      });
    } finally {
      setExporting({ csv: false, pdf: false });
    }
  };

  const handlePDFExport = async () => {
    if (!exportGating.allowed) {
      toast({
        title: 'Upgrade Required',
        description: exportGating.upgradeMessage,
        variant: 'destructive'
      });
      return;
    }

    try {
      setExporting({ csv: false, pdf: true });
      
      if (!data || data.length === 0) {
        toast({
          title: 'No Data',
          description: 'No data available to export',
          variant: 'destructive'
        });
        return;
      }

      await exportToPDF(data, title, filename, headers, agency?.name);
      
      toast({
        title: 'Export Successful',
        description: `${title} exported to PDF successfully`
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: 'Export Failed', 
        description: 'Failed to export PDF file',
        variant: 'destructive'
      });
    } finally {
      setExporting({ csv: false, pdf: false });
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCSVExport}
        disabled={disabled || !data?.length || exporting.csv || !exportGating.allowed}
        className="flex items-center gap-2"
      >
        {exporting.csv ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Table className="h-4 w-4" />
        )}
        Export CSV
        {!exportGating.allowed && <Badge variant="secondary" className="ml-2">Pro</Badge>}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handlePDFExport}
        disabled={disabled || !data?.length || exporting.pdf || !exportGating.allowed}
        className="flex items-center gap-2"
      >
        {exporting.pdf ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        Export PDF
        {!exportGating.allowed && <Badge variant="secondary" className="ml-2">Pro</Badge>}
      </Button>
    </div>
  );
};