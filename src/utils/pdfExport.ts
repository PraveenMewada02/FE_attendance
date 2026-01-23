import jsPDF from 'jspdf';
// @ts-ignore - jspdf-autotable doesn't have proper TypeScript definitions
import autoTable from 'jspdf-autotable';

export interface ExportColumn {
  header: string;
  dataKey: string;
  width?: number;
}

export interface ExportOptions {
  title: string;
  filename: string;
  columns: ExportColumn[];
  data: any[];
  dateRange?: string;
}

export const exportToPDF = (options: ExportOptions) => {
  const { title, filename, columns, data, dateRange } = options;

  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  const doc = new jsPDF('landscape', 'mm', 'a4');
  
  // Add title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 15);
  
  // Add date range if provided
  if (dateRange) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(dateRange, 14, 22);
  }

  // Prepare table data
  const tableColumns = columns.map(col => col.header);
  const tableRows = data.map(row => 
    columns.map(col => {
      const value = row[col.dataKey];
      return value !== null && value !== undefined ? String(value) : '--';
    })
  );

  // Add table
  autoTable(doc, {
    head: [tableColumns],
    body: tableRows,
    startY: dateRange ? 28 : 22,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [59, 130, 246], // Blue color
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    margin: { top: 20, left: 14, right: 14 },
    tableWidth: 'auto',
  });

  // Add footer with page number
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
    doc.text(
      `Generated on ${new Date().toLocaleString()}`,
      doc.internal.pageSize.getWidth() - 14,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'right' }
    );
  }

  // Save the PDF
  doc.save(filename);
};

