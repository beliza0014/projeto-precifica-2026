import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF interface for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Types for export data
export interface ExportSheet {
  name: string;
  data: Record<string, any>[];
}

// Format currency for PT-BR
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Format percentage for PT-BR
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Format date for PT-BR
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('pt-BR');
};

// Export to XLSX
export const exportToXlsx = (filename: string, sheets: ExportSheet[]): void => {
  try {
    // Create new workbook
    const workbook = XLSX.utils.book_new();

    sheets.forEach((sheet) => {
      // Ensure sheet name is valid (max 31 chars, no special chars)
      const sheetName = sheet.name.substring(0, 31).replace(/[\\/*?:[\]]/g, '_');
      
      // Convert data to worksheet
      const worksheet = XLSX.utils.json_to_sheet(sheet.data);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    // Generate file and download
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const fullFilename = `${filename}_${timestamp}.xlsx`;
    
    XLSX.writeFile(workbook, fullFilename);
    
    console.log(`✅ Exported ${sheets.length} sheets to ${fullFilename}`);
  } catch (error) {
    console.error('Error exporting to XLSX:', error);
    throw new Error('Falha ao exportar XLSX. Tente novamente.');
  }
};

// Export to PDF
export const exportToPdf = (filename: string, sheets: ExportSheet[]): void => {
  try {
    const doc = new jsPDF();
    let currentPage = 1;

    sheets.forEach((sheet, sheetIndex) => {
      // Add new page for each sheet (except first)
      if (sheetIndex > 0) {
        doc.addPage();
        currentPage++;
      }

      // Add sheet title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(sheet.name, 20, 20);

      if (sheet.data && sheet.data.length > 0) {
        // Get columns from first data row
        const columns = Object.keys(sheet.data[0]);
        
        // Prepare table data
        const tableData = sheet.data.map(row => 
          columns.map(col => {
            const value = row[col];
            if (typeof value === 'number') {
              // Format numbers appropriately
              if (col.toLowerCase().includes('percentual') || col.toLowerCase().includes('margem')) {
                return formatPercentage(value / 100);
              } else if (col.toLowerCase().includes('custo') || col.toLowerCase().includes('preço') || col.toLowerCase().includes('valor')) {
                return formatCurrency(value);
              }
              return value.toFixed(2);
            }
            return String(value || '');
          })
        );

        // Add table
        doc.autoTable({
          head: [columns],
          body: tableData,
          startY: 30,
          styles: {
            fontSize: 8,
            cellPadding: 2
          },
          headStyles: {
            fillColor: [79, 70, 229], // Primary color
            textColor: 255,
            fontStyle: 'bold'
          },
          columnStyles: columns.reduce((acc, col, index) => {
            if (col.toLowerCase().includes('custo') || col.toLowerCase().includes('preço') || col.toLowerCase().includes('valor')) {
              acc[index] = { halign: 'right' };
            }
            return acc;
          }, {} as Record<number, any>)
        });
      } else {
        // No data message
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Nenhum dado disponível para esta seção.', 20, 40);
      }
    });

    // Generate filename and save
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const fullFilename = `${filename}_${timestamp}.pdf`;
    
    doc.save(fullFilename);
    
    console.log(`✅ Exported ${sheets.length} sheets to ${fullFilename}`);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Falha ao exportar PDF. Tente novamente.');
  }
};

// Export all reports in a single XLSX file
export const exportAllReports = (allSheets: ExportSheet[]): void => {
  if (allSheets.length === 0) {
    throw new Error('Nenhum dado disponível para exportar.');
  }
  
  exportToXlsx('Relatorio_Completo', allSheets);
};