'use client';

import { AlertTriangle } from 'lucide-react';
import { Pagination } from '@/components/fleet/Pagination';
import { FleetCard } from '@/components/fleet/FleetDashboard';
import { formatBillingMode, formatCurrency, formatDate } from './reportUtils';
import type { EnrichedSession } from './types';

export function SessionResults({
  sessions,
  currentPage,
  totalPages,
  total,
  pageSize,
  tr,
  onPageChange,
}: {
  sessions: EnrichedSession[];
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
  tr: (key: string, fallback: string) => string;
  onPageChange: (page: number) => void;
}) {
  return (
    <>
      <FleetCard className="hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="px-4 py-3 text-left">{tr('col_employee', 'Employee')}</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">{tr('col_station', 'Station')}</th>
                <th className="px-4 py-3 text-left">{tr('col_date', 'Date')}</th>
                <th className="px-4 py-3 text-left">{tr('col_kwh', 'kWh')}</th>
                <th className="px-4 py-3 text-left">{tr('col_cost', 'Cost')}</th>
                <th className="px-4 py-3 text-left">{tr('col_billing', 'Billing')}</th>
                <th className="px-4 py-3 text-left">Policy status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <SessionRow key={session.session_id} session={session} tr={tr} />
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-zinc-500">
                    {tr('no_sessions', 'No sessions found for the selected period.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-zinc-800 px-4">
          <Pagination currentPage={currentPage} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={onPageChange} />
        </div>
      </FleetCard>

      <div className="space-y-3 md:hidden">
        {sessions.length === 0 && (
          <FleetCard className="px-4 py-10 text-center text-zinc-500">
            {tr('no_sessions', 'No sessions found for the selected period.')}
          </FleetCard>
        )}
        {sessions.map((session) => (
          <SessionCard key={session.session_id} session={session} tr={tr} />
        ))}
      </div>
      <div className="md:hidden">
        <Pagination currentPage={currentPage} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={onPageChange} />
      </div>
    </>
  );
}

function SessionRow({ session, tr }: { session: EnrichedSession; tr: (key: string, fallback: string) => string }) {
  return (
    <tr className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
      <td className="px-4 py-3">
        <div className="font-medium text-white">{session.employee_name}</div>
        <div className="text-xs text-zinc-500">{session.employee_email}</div>
      </td>
      <td className="px-4 py-3 text-zinc-300">{session.resolved_department || '-'}</td>
      <td className="px-4 py-3 text-zinc-300">{session.station_name}</td>
      <td className="px-4 py-3 text-zinc-400">{formatDate(session.started_at)}</td>
      <td className="px-4 py-3 text-zinc-300">{session.delivered_kwh.toFixed(2)}</td>
      <td className="px-4 py-3 font-medium text-white">{formatCurrency(session.total_cost_cents)}</td>
      <td className="px-4 py-3">
        <BillingBadge value={session.billing_mode} tr={tr} />
      </td>
      <td className="px-4 py-3">
        <div className="text-zinc-300">{session.resolved_policy_name || '-'}</div>
        {session.policy_violation && (
          <div className="mt-2 flex max-w-[22rem] items-start gap-1.5 rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1.5 text-xs leading-5 text-amber-200">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="whitespace-pre-line">{session.policy_violation}</span>
          </div>
        )}
      </td>
    </tr>
  );
}

function SessionCard({ session, tr }: { session: EnrichedSession; tr: (key: string, fallback: string) => string }) {
  return (
    <FleetCard as="article" className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-white">{session.employee_name}</h2>
          <p className="mt-1 break-all text-sm text-zinc-500">{session.employee_email}</p>
        </div>
        <BillingBadge value={session.billing_mode} tr={tr} />
      </div>
      <dl className="mt-4 space-y-2 text-sm">
        <MobileRow label="Department" value={session.resolved_department || '-'} />
        <MobileRow label={tr('col_station', 'Station')} value={session.station_name} />
        <MobileRow label={tr('col_date', 'Date')} value={formatDate(session.started_at)} />
        <MobileRow label={tr('col_kwh', 'kWh')} value={session.delivered_kwh.toFixed(2)} />
        <MobileRow label={tr('col_cost', 'Cost')} value={formatCurrency(session.total_cost_cents)} />
        <MobileRow label="Policy" value={session.resolved_policy_name || '-'} />
        {session.policy_violation && <MobileRow label="Policy violation" value={session.policy_violation} />}
      </dl>
    </FleetCard>
  );
}

function BillingBadge({ value, tr }: { value: string; tr: (key: string, fallback: string) => string }) {
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-medium ${
        value === 'COMPANY_PAID' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
      }`}
    >
      {formatBillingMode(value, tr('badge_company', 'Company'), tr('badge_reimbursable', 'Reimbursable'))}
    </span>
  );
}

function MobileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="whitespace-pre-line text-right text-zinc-200">{value}</dd>
    </div>
  );
}
