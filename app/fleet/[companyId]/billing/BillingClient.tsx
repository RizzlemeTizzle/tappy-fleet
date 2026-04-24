'use client';

import { useEffect, useState } from 'react';
import { fleetButtonClass } from '@/lib/fleet-ui';

interface Invoice {
  id: string;
  periodStart: string;
  periodEnd: string;
  totalCents: number;
  status: string;
  _count?: { lines: number };
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-zinc-500/20 text-zinc-400',
  SENT: 'bg-blue-500/20 text-blue-400',
  PAID: 'bg-green-500/20 text-green-400',
  OVERDUE: 'bg-red-500/20 text-red-400',
};

function formatMonth(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function formatCurrency(cents: number) {
  return `€${(cents / 100).toFixed(2)}`;
}

export default function BillingClient({
  companyId,
  initialInvoices,
}: {
  companyId: string;
  initialInvoices: Invoice[];
}) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  useEffect(() => {
    setInvoices(initialInvoices);
  }, [initialInvoices]);
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadPdf = async (invoiceId: string) => {
    setDownloading(invoiceId);
    try {
      const res = await fetch(
        `/api/fleet/${companyId}/billing/invoices/${invoiceId}/pdf`,
      );
      if (!res.ok) { alert('Failed to download PDF'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Billing & Invoices</h1>
        <p className="text-sm text-zinc-400 mt-1">Invoices are generated automatically at the end of each month.</p>
      </div>
      <div className="hidden overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 md:block">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="text-left px-5 py-3">Period</th>
              <th className="text-left px-5 py-3">Amount</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Sessions</th>
              <th className="text-left px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="px-5 py-3 text-white font-medium">{formatMonth(inv.periodStart)}</td>
                <td className="px-5 py-3 text-white">{formatCurrency(inv.totalCents)}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${STATUS_STYLES[inv.status] ?? 'bg-zinc-700 text-zinc-400'}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-zinc-400">{inv._count?.lines ?? '—'}</td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => downloadPdf(inv.id)}
                    disabled={downloading === inv.id}
                    className={fleetButtonClass('secondary', 'sm')}
                  >
                    {downloading === inv.id ? 'Downloading...' : 'Download PDF'}
                  </button>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-zinc-500">
                  No invoices yet. Invoices are generated automatically at the end of each month.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {invoices.length === 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-10 text-center text-zinc-500">
            No invoices yet. Invoices are generated automatically at the end of each month.
          </div>
        )}
        {invoices.map((inv) => (
          <article key={inv.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-white">{formatMonth(inv.periodStart)}</h2>
                <p className="mt-1 text-sm text-zinc-400">{formatCurrency(inv.totalCents)}</p>
              </div>
              <span className={`rounded px-2 py-1 text-xs font-medium ${STATUS_STYLES[inv.status] ?? 'bg-zinc-700 text-zinc-400'}`}>
                {inv.status}
              </span>
            </div>
            <p className="mt-3 text-sm text-zinc-400">Sessions: {inv._count?.lines ?? '—'}</p>
            <button
              onClick={() => downloadPdf(inv.id)}
              disabled={downloading === inv.id}
              className={fleetButtonClass('secondary', 'md', 'mt-4 w-full')}
            >
              {downloading === inv.id ? 'Downloading...' : 'Download PDF'}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
