'use client';

import { useEffect, useState } from 'react';
import { Download, Filter } from 'lucide-react';
import { usePathname } from 'next/navigation';
import DatePicker from './DatePicker';
import { fleetButtonClass } from '@/lib/fleet-ui';

interface Session {
  session_id: string;
  employee_name: string;
  employee_email: string;
  station_name: string;
  started_at: string;
  delivered_kwh: number;
  total_cost_cents: number;
  billing_mode: string;
  cost_center_code?: string;
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ReportsClient({
  companyId,
  initialSessions,
  total,
  from,
  to,
}: {
  companyId: string;
  initialSessions: Session[];
  total: number;
  from: string;
  to: string;
}) {
  const pathname = usePathname();
  const [fromDate, setFromDate] = useState(from);
  const [toDate, setToDate] = useState(to);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setFromDate(from);
    setToDate(to);
  }, [from, to]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const qs = new URLSearchParams();
      if (fromDate) qs.set('from', fromDate);
      if (toDate) qs.set('to', toDate);
      const res = await fetch(`/api/fleet/${companyId}/reports/sessions/export?${qs}`);
      if (!res.ok) {
        alert('Export failed');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fleet-report.csv';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white">Session Reports</h1>
        <button
          type="button"
          onClick={exportCsv}
          disabled={exporting}
          className={fleetButtonClass('primary', 'md', 'w-full sm:w-auto')}
        >
          <Download size={16} strokeWidth={2.2} />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <form action={pathname} method="get" className="mb-6 grid gap-3 sm:grid-cols-2 xl:flex xl:flex-wrap xl:items-end">
        <DatePicker label="From" value={fromDate} onChange={setFromDate} />
        <DatePicker label="To" value={toDate} onChange={setToDate} />
        <input type="hidden" name="from" value={fromDate} />
        <input type="hidden" name="to" value={toDate} />
        <button
          type="submit"
          className={fleetButtonClass('secondary', 'md', 'w-full sm:col-span-2 xl:w-auto')}
        >
          <Filter size={16} strokeWidth={2.2} />
          Apply
        </button>
      </form>

      <div className="mb-3 text-sm text-zinc-400">{total} sessions total</div>

      <div className="hidden overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 md:block">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[840px] text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="px-4 py-3 text-left">Employee</th>
              <th className="px-4 py-3 text-left">Station</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">kWh</th>
              <th className="px-4 py-3 text-left">Cost</th>
              <th className="px-4 py-3 text-left">Billing</th>
            </tr>
          </thead>
          <tbody>
            {initialSessions.map((s) => (
              <tr key={s.session_id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{s.employee_name}</div>
                  <div className="text-xs text-zinc-500">{s.employee_email}</div>
                </td>
                <td className="px-4 py-3 text-zinc-300">{s.station_name}</td>
                <td className="px-4 py-3 text-zinc-400">{formatDate(s.started_at)}</td>
                <td className="px-4 py-3 text-zinc-300">{s.delivered_kwh.toFixed(2)}</td>
                <td className="px-4 py-3 font-medium text-white">{formatCurrency(s.total_cost_cents)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      s.billing_mode === 'COMPANY_PAID'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {s.billing_mode === 'COMPANY_PAID' ? 'Company' : 'Reimbursable'}
                  </span>
                </td>
              </tr>
            ))}
            {initialSessions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                  No sessions found for the selected period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {initialSessions.length === 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-10 text-center text-zinc-500">
            No sessions found for the selected period.
          </div>
        )}
        {initialSessions.map((s) => (
          <article key={s.session_id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-semibold text-white">{s.employee_name}</h2>
                <p className="mt-1 break-all text-sm text-zinc-500">{s.employee_email}</p>
              </div>
              <span
                className={`rounded px-2 py-1 text-xs font-medium ${
                  s.billing_mode === 'COMPANY_PAID'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}
              >
                {s.billing_mode === 'COMPANY_PAID' ? 'Company' : 'Reimbursable'}
              </span>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <MobileRow label="Station" value={s.station_name} />
              <MobileRow label="Date" value={formatDate(s.started_at)} />
              <MobileRow label="kWh" value={s.delivered_kwh.toFixed(2)} />
              <MobileRow label="Cost" value={formatCurrency(s.total_cost_cents)} />
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}

function MobileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-right text-zinc-200">{value}</dd>
    </div>
  );
}
