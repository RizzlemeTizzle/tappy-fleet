'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Download, MessageSquareText, WalletCards, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fleetButtonClass } from '@/lib/fleet-ui';
import { useT } from '@/lib/i18n';

interface ReimbursementSummary {
  total_requests: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  requested_amount_cents: number;
  pending_amount_cents: number;
  approved_amount_cents: number;
}

interface Reimbursement {
  id: string;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED';
  request_note: string | null;
  review_note: string | null;
  approved_amount_cents: number | null;
  requested_at: string;
  reviewed_at: string | null;
  session_id: string;
  employee: {
    membership_id: string;
    user_id: string | null;
    name: string | null;
    email: string | null;
  };
  session: {
    started_at: string | null;
    ended_at: string | null;
    delivered_kwh: number;
    total_cost_cents: number;
    station_name: string | null;
    station_address: string | null;
  };
}

const FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'REQUESTED', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
] as const;

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ReimbursementsClient({
  companyId,
  initialSummary,
  initialReimbursements,
}: {
  companyId: string;
  initialSummary: ReimbursementSummary;
  initialReimbursements: Reimbursement[];
}) {
  const t = useT();
  const router = useRouter();
  const tr = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]['value']>('ALL');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [modalRequest, setModalRequest] = useState<Reimbursement | null>(null);
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewNote, setReviewNote] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [feedback, setFeedback] = useState('');

  const reimbursements = useMemo(
    () =>
      initialReimbursements.filter((item) =>
        activeFilter === 'ALL' ? true : item.status === activeFilter,
      ),
    [activeFilter, initialReimbursements],
  );

  const openReview = (request: Reimbursement, nextDecision: 'APPROVED' | 'REJECTED') => {
    setModalRequest(request);
    setDecision(nextDecision);
    setReviewNote('');
    setApprovedAmount(
      nextDecision === 'APPROVED'
        ? ((request.session.total_cost_cents ?? 0) / 100).toFixed(2)
        : '',
    );
  };

  const closeReview = () => {
    if (reviewingId) return;
    setModalRequest(null);
    setReviewNote('');
    setApprovedAmount('');
    setDecision('APPROVED');
  };

  const submitReview = async () => {
    if (!modalRequest) return;

    setReviewingId(modalRequest.id);
    setFeedback('');

    try {
      const payload: Record<string, unknown> = {
        status: decision,
        reviewNote: reviewNote.trim() || undefined,
      };

      if (decision === 'APPROVED') {
        const parsed = Number.parseFloat(approvedAmount);
        payload.approvedAmountCents = Number.isFinite(parsed)
          ? Math.round(parsed * 100)
          : modalRequest.session.total_cost_cents;
      }

      const res = await fetch(`/api/fleet/${companyId}/reimbursements/${modalRequest.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback(body.error ?? 'Could not update reimbursement request.');
        return;
      }

      closeReview();
      router.refresh();
    } catch {
      setFeedback('Could not update reimbursement request.');
    } finally {
      setReviewingId(null);
    }
  };

  const exportCsv = async () => {
    setFeedback('');
    try {
      const qs = activeFilter === 'ALL' ? '' : `?status=${activeFilter}`;
      const res = await fetch(`/api/fleet/${companyId}/reimbursements/export${qs}`);
      if (!res.ok) {
        setFeedback('Could not export reimbursements.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fleet-reimbursements-${companyId}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setFeedback('Could not export reimbursements.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {tr('nav_reimbursements', 'Reimbursements')}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Review employee reimbursement requests from the Tappy app and keep a clean finance queue.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void exportCsv()}
          className={fleetButtonClass('secondary', 'md', 'w-full sm:w-auto')}
        >
          <Download size={16} strokeWidth={2.1} />
          Export CSV
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Pending requests"
          value={String(initialSummary.pending_count)}
          hint={formatCurrency(initialSummary.pending_amount_cents)}
          icon={WalletCards}
        />
        <SummaryCard
          label="Approved"
          value={String(initialSummary.approved_count)}
          hint={formatCurrency(initialSummary.approved_amount_cents)}
          icon={CheckCircle2}
        />
        <SummaryCard
          label="Rejected"
          value={String(initialSummary.rejected_count)}
          hint="Closed without payout"
          icon={XCircle}
        />
        <SummaryCard
          label="Total requested"
          value={String(initialSummary.total_requests)}
          hint={formatCurrency(initialSummary.requested_amount_cents)}
          icon={MessageSquareText}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const isActive = filter.value === activeFilter;
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              className={
                isActive
                  ? 'rounded-full border border-[#33d6c5]/40 bg-[#33d6c5]/15 px-4 py-2 text-sm font-medium text-white'
                  : 'rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white'
              }
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {feedback && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {feedback}
        </div>
      )}

      <div className="mt-6 hidden overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="px-4 py-3 text-left">Employee</th>
                <th className="px-4 py-3 text-left">Station</th>
                <th className="px-4 py-3 text-left">Session</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Requested</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reimbursements.map((request) => (
                <tr key={request.id} className="border-b border-zinc-800/60 align-top hover:bg-zinc-800/20">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{request.employee.name ?? 'Unknown employee'}</div>
                    <div className="text-xs text-zinc-500">{request.employee.email ?? 'No email'}</div>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    <div>{request.session.station_name ?? 'Unknown station'}</div>
                    <div className="mt-1 text-xs text-zinc-500">{request.session.station_address ?? '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    <div>{formatDate(request.session.started_at)}</div>
                    <div className="mt-1 text-xs text-zinc-500">{request.session.delivered_kwh.toFixed(2)} kWh</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{formatCurrency(request.session.total_cost_cents)}</div>
                    {request.approved_amount_cents != null && (
                      <div className="mt-1 text-xs text-zinc-500">
                        Approved {formatCurrency(request.approved_amount_cents)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={request.status} />
                    {request.review_note && (
                      <div className="mt-2 max-w-xs text-xs text-zinc-500">{request.review_note}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{formatDate(request.requested_at)}</td>
                  <td className="px-4 py-3">
                    {request.status === 'REQUESTED' ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openReview(request, 'APPROVED')}
                          className={fleetButtonClass('secondary', 'sm')}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => openReview(request, 'REJECTED')}
                          className={fleetButtonClass('danger', 'sm')}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-500">Reviewed</span>
                    )}
                  </td>
                </tr>
              ))}
              {reimbursements.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-zinc-500">
                    No reimbursement requests in this view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 space-y-3 md:hidden">
        {reimbursements.length === 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-10 text-center text-zinc-500">
            No reimbursement requests in this view.
          </div>
        )}
        {reimbursements.map((request) => (
          <article key={request.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-semibold text-white">{request.employee.name ?? 'Unknown employee'}</h2>
                <p className="mt-1 break-all text-sm text-zinc-500">{request.employee.email ?? 'No email'}</p>
              </div>
              <StatusBadge status={request.status} />
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <MobileRow label="Station" value={request.session.station_name ?? 'Unknown station'} />
              <MobileRow label="Date" value={formatDate(request.session.started_at)} />
              <MobileRow label="Requested" value={formatCurrency(request.session.total_cost_cents)} />
              <MobileRow
                label="Approved"
                value={request.approved_amount_cents != null ? formatCurrency(request.approved_amount_cents) : '—'}
              />
            </dl>
            {request.request_note && (
              <p className="mt-3 text-sm text-zinc-400">
                Request note: {request.request_note}
              </p>
            )}
            {request.review_note && (
              <p className="mt-2 text-sm text-zinc-500">
                Review note: {request.review_note}
              </p>
            )}
            {request.status === 'REQUESTED' && (
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => openReview(request, 'APPROVED')}
                  className={fleetButtonClass('secondary', 'md', 'w-full')}
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => openReview(request, 'REJECTED')}
                  className={fleetButtonClass('danger', 'md', 'w-full')}
                >
                  Reject
                </button>
              </div>
            )}
          </article>
        ))}
      </div>

      {modalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.5)]">
            <h2 className="text-xl font-bold text-white">
              {decision === 'APPROVED' ? 'Approve reimbursement' : 'Reject reimbursement'}
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              {modalRequest.employee.name ?? 'Unknown employee'} · {modalRequest.session.station_name ?? 'Unknown station'}
            </p>

            {decision === 'APPROVED' && (
              <label className="mt-5 block">
                <span className="mb-1.5 block text-sm text-zinc-400">Approved amount (EUR)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={approvedAmount}
                  onChange={(event) => setApprovedAmount(event.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#33d6c5]"
                />
              </label>
            )}

            <label className="mt-5 block">
              <span className="mb-1.5 block text-sm text-zinc-400">
                {decision === 'APPROVED' ? 'Approval note' : 'Rejection reason'}
              </span>
              <textarea
                rows={4}
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                placeholder={
                  decision === 'APPROVED'
                    ? 'Optional note for finance context'
                    : 'Explain why this request is being rejected'
                }
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#33d6c5]"
              />
            </label>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={closeReview}
                className={fleetButtonClass('subtle', 'md', 'flex-1')}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitReview()}
                disabled={reviewingId === modalRequest.id}
                className={decision === 'APPROVED'
                  ? fleetButtonClass('primary', 'md', 'flex-1')
                  : fleetButtonClass('danger', 'md', 'flex-1')}
              >
                {reviewingId === modalRequest.id
                  ? 'Saving...'
                  : decision === 'APPROVED'
                    ? 'Approve request'
                    : 'Reject request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof WalletCards;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          <p className="mt-2 text-xs text-zinc-500">{hint}</p>
        </div>
        <div className="rounded-2xl border border-[#33d6c5]/20 bg-[#33d6c5]/10 p-3 text-[#7ce9de]">
          <Icon size={18} strokeWidth={2.1} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Reimbursement['status'] }) {
  const classes =
    status === 'APPROVED'
      ? 'bg-green-500/20 text-green-300'
      : status === 'REJECTED'
        ? 'bg-red-500/20 text-red-300'
        : 'bg-amber-500/20 text-amber-300';

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${classes}`}>
      {status.toLowerCase()}
    </span>
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
