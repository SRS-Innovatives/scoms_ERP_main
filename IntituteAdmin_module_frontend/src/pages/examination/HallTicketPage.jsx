import React from 'react';
import HallTicketTemplate from '../../components/print/HallTicketTemplate';

export const HallTicketPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Hall Ticket Generator UI</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Generate and print examination hall tickets for verified students with exam center venue</p>
      </div>

      <HallTicketTemplate />
    </div>
  );
};

export default HallTicketPage;
