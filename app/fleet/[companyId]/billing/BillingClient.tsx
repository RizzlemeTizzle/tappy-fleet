'use client';

import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { FleetCard, FleetPageHeader, StatusPill } from '@/components/fleet/FleetDashboard';
import { fleetButtonClass } from '@/lib/fleet-ui';
import { useT } from '@/lib/i18n';

interface Invoice {
  id: string;
  periodStart: string;
  periodEnd: string;
  totalCents: number;
  status: string;
  _count?: { lines: number };
}

const STATUS_TONES = {
  DRAFT: 'neutral',
  SENT: 'blue',
  PAID: 'teal',
  OVERDUE: 'red',
} as const;

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
  const t = useT();
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
      <FleetPageHeader
        title={t('billing_title')}
        description={t('billing_subtitle')}
      />
      <FleetCard className="hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="text-left px-5 py-3">{t('billing_col_period')}</th>
              <th className="text-left px-5 py-3">{t('billing_col_amount')}</th>
              <th className="text-left px-5 py-3">{t('billing_col_status')}</th>
              <th className="text-left px-5 py-3">{t('billing_col_sessions')}</th>
              <th className="text-left px-5 py-3">{t('billing_col_actions')}</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="px-5 py-3 text-white font-medium">{formatMonth(inv.periodStart)}</td>
                <td className="px-5 py-3 text-white">{formatCurrency(inv.totalCents)}</td>
                <td className="px-5 py-3">
                  <StatusPill tone={STATUS_TONES[inv.status as keyof typeof STATUS_TONES] ?? 'neutral'}>
                    {inv.status}
                  </StatusPill>
                </td>
                <td className="px-5 py-3 text-zinc-400">{inv._count?.lines ?? '—'}</td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => downloadPdf(inv.id)}
                    disabled={downloading === inv.id}
                    className={fleetButtonClass('secondary', 'sm')}
                  >
                    {downloading === inv.id ? t('billing_downloading') : t('billing_download_pdf')}
                  </button>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-zinc-500">
                  {t('billing_empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </FleetCard>

      <div className="space-y-3 md:hidden">
        {invoices.length === 0 && (
          <FleetCard className="px-4 py-10 text-center text-zinc-500">
            {t('billing_empty')}
          </FleetCard>
        )}
        {invoices.map((inv) => (
          <FleetCard key={inv.id} as="article" className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                  <h2 className="font-semibold text-white">{formatMonth(inv.periodStart)}</h2>
                </div>
                <p className="mt-2 text-sm text-zinc-400">{formatCurrency(inv.totalCents)}</p>
              </div>
              <StatusPill tone={STATUS_TONES[inv.status as keyof typeof STATUS_TONES] ?? 'neutral'}>
                {inv.status}
              </StatusPill>
            </div>
            <p className="mt-3 text-sm text-zinc-400">{t('billing_col_sessions')}: {inv._count?.lines ?? '-'}</p>
            <button
              onClick={() => downloadPdf(inv.id)}
              disabled={downloading === inv.id}
              className={fleetButtonClass('secondary', 'md', 'mt-4 w-full')}
            >
              {downloading === inv.id ? t('billing_downloading') : t('billing_download_pdf')}
            </button>
          </FleetCard>
        ))}
      </div>
    </div>
  );
}
