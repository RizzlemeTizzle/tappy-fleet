'use client';

import { useState } from 'react';
import { Download, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [fromDate, setFromDate] = useState(from);
  const [toDate, setToDate] = useState(to);
  const [exporting, setExporting] = useState(false);

  const applyFilter = () => {
    const qs = new URLSearchParams();
    if (fromDate) qs.set('from', fromDate);
    if (toDate) qs.set('to', toDate);
    router.push(`?${qs}`);
  };

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
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Session Reports</h1>
        <button
          onClick={exportCsv}
          disabled={exporting}
          className={fleetButtonClass('secondary')}
        >
          <Download size={16} strokeWidth={2.2} />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <div className="mb-6 flex items-end gap-3">
        <DatePicker label="From" value={fromDate} onChange={setFromDate} />
        <DatePicker label="To" value={toDate} onChange={setToDate} />
        <button
          onClick={applyFilter}
          className={fleetButtonClass('primary')}
        >
          <Filter size={16} strokeWidth={2.2} />
          Apply
        </button>
      </div>

      <div className="mb-3 text-sm text-zinc-400">{total} sessions total</div>

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        <table className="w-full text-sm">
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
  );
}
