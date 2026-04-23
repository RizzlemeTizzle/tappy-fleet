'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
  return `€${(cents / 100).toFixed(2)}`;
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
      const res = await fetch(
        `/api/fleet/${companyId}/reports/sessions/export?${qs}`,
      );
      if (!res.ok) { alert('Export failed'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fleet-report.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Session Reports</h1>
        <button
          onClick={exportCsv}
          disabled={exporting}
          className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
        >
          {exporting ? 'Exporting...' : '↓ Export CSV'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div>
          <label className="text-xs text-zinc-400 block mb-1">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#4CAF50]"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-400 block mb-1">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#4CAF50]"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={applyFilter}
            className="bg-[#4CAF50] hover:bg-[#43A047] text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Apply
          </button>
        </div>
      </div>

      <div className="text-zinc-400 text-sm mb-3">{total} sessions total</div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="text-left px-4 py-3">Employee</th>
              <th className="text-left px-4 py-3">Station</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">kWh</th>
              <th className="text-left px-4 py-3">Cost</th>
              <th className="text-left px-4 py-3">Billing</th>
            </tr>
          </thead>
          <tbody>
            {initialSessions.map((s) => (
              <tr key={s.session_id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="px-4 py-3">
                  <div className="text-white font-medium">{s.employee_name}</div>
                  <div className="text-zinc-500 text-xs">{s.employee_email}</div>
                </td>
                <td className="px-4 py-3 text-zinc-300">{s.station_name}</td>
                <td className="px-4 py-3 text-zinc-400">{formatDate(s.started_at)}</td>
                <td className="px-4 py-3 text-zinc-300">{s.delivered_kwh.toFixed(2)}</td>
                <td className="px-4 py-3 text-white font-medium">{formatCurrency(s.total_cost_cents)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    s.billing_mode === 'COMPANY_PAID'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
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
