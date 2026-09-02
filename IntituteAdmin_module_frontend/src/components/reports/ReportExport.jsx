import React, { useState } from 'react';
import { FileText, FileSpreadsheet, FileDown, Printer, Loader2 } from 'lucide-react';
import reportService from '../../services/reportService';
import { useNotification } from '../../context/NotificationContext';

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/** Real PDF/Excel/CSV export (via the backend's binary export endpoint) + Print, driven by
 * whatever formats the report's own definition allows. */
export const ReportExport = ({ reportCode, reportName, filters, allowedFormats = ['PDF', 'EXCEL', 'CSV', 'PRINT'] }) => {
  const { error: showError } = useNotification();
  const [exporting, setExporting] = useState(null);

  const handleExport = async (format) => {
    if (format === 'PRINT') {
      window.print();
      return;
    }
    setExporting(format);
    try {
      const blob = await reportService.exportReport(reportCode, filters, format);
      const ext = format === 'EXCEL' ? 'xlsx' : format.toLowerCase();
      downloadBlob(blob, `${reportName.replace(/\s+/g, '_')}.${ext}`);
    } catch (err) {
      showError(`Failed to export ${format}: ${err.message}`);
    } finally {
      setExporting(null);
    }
  };

  const BUTTONS = [
    { format: 'PDF', label: 'PDF', icon: FileText, className: 'bg-rose-600 hover:bg-rose-700' },
    { format: 'EXCEL', label: 'Excel', icon: FileSpreadsheet, className: 'bg-emerald-600 hover:bg-emerald-700' },
    { format: 'CSV', label: 'CSV', icon: FileDown, className: 'bg-slate-700 hover:bg-slate-800' },
    { format: 'PRINT', label: 'Print', icon: Printer, className: 'bg-indigo-600 hover:bg-indigo-700' },
  ].filter((b) => allowedFormats.includes(b.format));

  return (
    <div className="flex flex-wrap gap-2 no-print">
      {BUTTONS.map((b) => (
        <button
          key={b.format}
          onClick={() => handleExport(b.format)}
          disabled={!!exporting}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg disabled:opacity-50 ${b.className}`}
        >
          {exporting === b.format ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <b.icon className="w-3.5 h-3.5" />}
          {b.label}
        </button>
      ))}
    </div>
  );
};

export default ReportExport;
