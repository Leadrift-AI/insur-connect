import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// CSV Export Helper
export const exportToCSV = (data: any[], filename: string, headers?: string[]) => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Generate headers from first object keys if not provided
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    csvHeaders.join(','), // Header row
    ...data.map(row => 
      csvHeaders.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// PDF Export Helper with Leadrift AI Branding
export const exportToPDF = (
  data: any[], 
  title: string, 
  filename: string,
  headers?: string[],
  agencyName?: string
) => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  const doc = new jsPDF();
  
  // Add Leadrift AI branding
  doc.setFontSize(20);
  doc.setTextColor(59, 130, 246); // Blue color
  doc.text('Leadrift AI', 20, 30);
  
  // Add agency name if provided
  if (agencyName) {
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text(agencyName, 20, 45);
  }
  
  // Add title
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 20, agencyName ? 60 : 50);
  
  // Add date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, agencyName ? 70 : 65);
  
  // Generate table headers
  const tableHeaders = headers || Object.keys(data[0]);
  
  // Convert data to table format
  const tableData = data.map(row => 
    tableHeaders.map(header => {
      const value = row[header];
      if (typeof value === 'number') {
        return value.toLocaleString();
      }
      return value || '';
    })
  );

  // Add table
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: agencyName ? 80 : 75,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { top: 20 },
  });

  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 30,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      'Powered by Leadrift AI',
      20,
      doc.internal.pageSize.height - 10
    );
  }

  // Save the PDF
  doc.save(`${filename}.pdf`);
};

// Format currency for exports
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Format percentage for exports
export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(2)}%`;
};

// Format date for exports
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};