'use client';

import { useState } from 'react';
import { API_URL } from '@/lib/api';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [invoices] = useState<Invoice[]>(initialInvoices);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  const downloadPdf = async (invoiceId: string) => {
    setDownloading(invoiceId);
    try {
      const res = await fetch(
        `${API_URL}/api/fleet/companies/${companyId}/billing/invoices/${invoiceId}/pdf`,
        { credentials: 'include' }
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

  const generateInvoice = async () => {
    setGenError('');
    setGenerating(true);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    try {
      const res = await fetch(
        `${API_URL}/api/fleet/companies/${companyId}/billing/invoices/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ periodStart: start, periodEnd: end }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setGenError(body.error ?? 'Generation failed');
        return;
      }
      router.refresh();
    } catch {
      setGenError('Network error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Billing & Invoices</h1>
        <button
          onClick={generateInvoice}
          disabled={generating}
          className="bg-[#4CAF50] hover:bg-[#43A047] text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
        >
          {generating ? 'Generating...' : '+ Generate invoice'}
        </button>
      </div>
      {genError && (
        <div className="mb-4 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
          {genError}
        </div>
      )}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
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
                    className="text-xs text-[#4CAF50] hover:underline disabled:opacity-50"
                  >
                    {downloading === inv.id ? 'Downloading...' : 'Download PDF'}
                  </button>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-zinc-500">
                  No invoices yet. Generate one for the current month.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
