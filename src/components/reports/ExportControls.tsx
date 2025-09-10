import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Table } from 'lucide-react';
import { exportToCSV, exportToPDF } from '@/utils/exportHelpers';
import { useAgency } from '@/hooks/useAgency';
import { useToast } from '@/hooks/use-toast';

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

  const handleCSVExport = () => {
    try {
      if (!data || data.length === 0) {
        toast({
          title: 'No Data',
          description: 'No data available to export',
          variant: 'destructive'
        });
        return;
      }

      exportToCSV(data, filename, headers);
      
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
    }
  };

  const handlePDFExport = () => {
    try {
      if (!data || data.length === 0) {
        toast({
          title: 'No Data',
          description: 'No data available to export',
          variant: 'destructive'
        });
        return;
      }

      exportToPDF(data, title, filename, headers, agency?.name);
      
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
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCSVExport}
        disabled={disabled || !data?.length}
        className="flex items-center gap-2"
      >
        <Table className="h-4 w-4" />
        Export CSV
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handlePDFExport}
        disabled={disabled || !data?.length}
        className="flex items-center gap-2"
      >
        <FileText className="h-4 w-4" />
        Export PDF
      </Button>
    </div>
  );
};