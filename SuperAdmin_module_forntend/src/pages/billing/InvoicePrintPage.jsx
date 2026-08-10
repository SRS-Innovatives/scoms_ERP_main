import React from 'react';
import { mockInvoices } from '../../data/mockBillingData';
import { Printer, Download, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

export const InvoicePrintPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const invoice = mockInvoices.find(i => i.id === id) || mockInvoices[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Non-printable Action Toolbar */}
      <div className="flex items-center justify-between no-print p-4 glass-card rounded-2xl border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => navigate('/super-admin/invoices')}
          className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
          >
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Printable A4 Tax Invoice Document */}
      <div className="max-w-4xl mx-auto bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-xl border border-slate-200 print:shadow-none print:border-none print:p-0 print-container">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
          <div>
            <h1 className="text-2xl font-black text-indigo-950 uppercase tracking-tight">TAX INVOICE</h1>
            <p className="text-xs font-bold text-slate-600 mt-1">SCOMS Educational Software Solutions Pvt. Ltd.</p>
            <p className="text-[11px] text-slate-500">GSTIN: <span className="font-mono font-bold">33AAAAA0000A1Z5</span> • SAC Code: <span className="font-mono font-bold">998313</span></p>
            <p className="text-[11px] text-slate-500">100, Tech Park Road, Guindy, Chennai, Tamil Nadu - 600032</p>
          </div>
          <div className="text-right">
            <h3 className="font-mono text-sm font-bold text-indigo-700">{invoice.invoiceNo}</h3>
            <p className="text-xs text-slate-500 mt-1">Date: <span className="font-bold text-slate-800">{invoice.invoiceDate}</span></p>
            <p className="text-xs text-slate-500">Due Date: <span className="font-bold text-slate-800">{invoice.dueDate}</span></p>
            <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" /> PAYMENT {invoice.status.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Bill To Info */}
        <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl mb-6 text-xs">
          <div>
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Billed To (Institution):</h4>
            <p className="font-bold text-sm text-slate-900">{invoice.institution}</p>
            <p className="text-slate-600 mt-0.5">GSTIN: <span className="font-mono font-bold">{invoice.gstin}</span></p>
          </div>
          <div>
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Payment Information:</h4>
            <p><span className="text-slate-500">Payment Mode:</span> <span className="font-bold">{invoice.paymentMode}</span></p>
            <p><span className="text-slate-500">Plan Description:</span> <span className="font-bold">{invoice.plan}</span></p>
          </div>
        </div>

        {/* Invoice Item Table */}
        <table className="w-full text-xs text-left mb-6 border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
              <th className="p-3">Item Description</th>
              <th className="p-3 text-center">SAC Code</th>
              <th className="p-3 text-right">Base Price (INR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            <tr>
              <td className="p-3">
                <p className="font-bold text-slate-900">{invoice.plan}</p>
                <p className="text-[11px] text-slate-500">Multi-tenant Cloud ERP Software Subscription License (12 Months)</p>
              </td>
              <td className="p-3 text-center font-mono">{invoice.sacCode}</td>
              <td className="p-3 text-right font-mono font-bold">₹{invoice.baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        {/* Tax Breakdown Table */}
        <div className="flex justify-end mb-8">
          <div className="w-72 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b text-slate-600">
              <span>Subtotal (Excl. Tax):</span>
              <span className="font-mono font-bold">₹{invoice.baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            {invoice.cgst > 0 && (
              <div className="flex justify-between py-1 border-b text-slate-600">
                <span>CGST (9%):</span>
                <span className="font-mono">₹{invoice.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {invoice.sgst > 0 && (
              <div className="flex justify-between py-1 border-b text-slate-600">
                <span>SGST (9%):</span>
                <span className="font-mono">₹{invoice.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {invoice.igst > 0 && (
              <div className="flex justify-between py-1 border-b text-slate-600">
                <span>IGST (18%):</span>
                <span className="font-mono">₹{invoice.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b-2 border-slate-900 text-sm font-black text-indigo-950">
              <span>Total Invoice Amount:</span>
              <span className="font-mono">₹{invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Footer Terms */}
        <div className="pt-6 border-t border-slate-300 text-[10px] text-slate-500 flex justify-between items-end">
          <div>
            <p className="font-bold text-slate-700">Terms & Conditions:</p>
            <p>1. Computer-generated tax invoice under CGST/SGST Rules 2017.</p>
            <p>2. Payment processed via DLT-verified Razorpay Gateway.</p>
          </div>
          <div className="text-right">
            <div className="h-10 w-32 border-b border-slate-400 mb-1 mx-auto"></div>
            <p className="font-bold text-slate-800">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePrintPage;
