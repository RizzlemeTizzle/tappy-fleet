'use client';

import { startTransition, useEffect, useMemo, useState } from 'react';
import { CalendarClock, Download, Filter, Save, Trash2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import DatePicker from './DatePicker';
import { fleetButtonClass } from '@/lib/fleet-ui';
import { useT } from '@/lib/i18n';

interface Session {
  session_id: string;
  employee_id?: string;
  employee_name: string;
  employee_email: string;
  station_name: string;
  started_at: string;
  delivered_kwh: number;
  total_cost_cents: number;
  billing_mode: string;
  cost_center_code?: string;
  department_id?: string | null;
  department_name?: string | null;
  policy_id?: string | null;
  policy_name?: string | null;
}

interface Member {
  id: string;
  user_name: string | null;
  user_email: string;
  department_id: string | null;
  department_name: string | null;
  policy_id: string | null;
  policy_name: string | null;
}

interface Policy {
  id: string;
  name: string;
}

interface ReportFilters {
  from: string;
  to: string;
  employeeId: string;
  department: string;
  billingMode: string;
  policyId: string;
}

interface SavedView {
  id: string;
  name: string;
  filters: ReportFilters;
  createdAt: string;
}

interface ExportSchedule {
  id: string;
  name: string;
  filters: ReportFilters;
  recipientEmail: string;
  frequency: 'weekly' | 'monthly';
  createdAt: string;
}

interface EnrichedSession extends Session {
  resolved_employee_id: string;
  resolved_department: string;
  resolved_policy_id: string;
  resolved_policy_name: string;
}

const BILLING_MODE_OPTIONS = [
  { value: '', label: 'All billing modes' },
  { value: 'COMPANY_PAID', label: 'Company paid' },
  { value: 'EMPLOYEE_REIMBURSABLE', label: 'Employee reimbursable' },
];

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatBillingMode(value: string, companyLabel: string, reimbursableLabel: string) {
  if (value === 'COMPANY_PAID') return companyLabel;
  if (value === 'EMPLOYEE_REIMBURSABLE') return reimbursableLabel;
  return value.replace(/_/g, ' ');
}

function buildSearchParams(filters: ReportFilters) {
  const qs = new URLSearchParams();
  if (filters.from) qs.set('from', filters.from);
  if (filters.to) qs.set('to', filters.to);
  if (filters.employeeId) qs.set('employeeId', filters.employeeId);
  if (filters.department) qs.set('department', filters.department);
  if (filters.billingMode) qs.set('billingMode', filters.billingMode);
  if (filters.policyId) qs.set('policyId', filters.policyId);
  return qs;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getPreviousClosedPeriod(frequency: ExportSchedule['frequency']) {
  const today = new Date();
  const currentDay = today.getDay();

  if (frequency === 'weekly') {
    const end = new Date(today);
    const daysSinceMonday = (currentDay + 6) % 7;
    end.setDate(today.getDate() - daysSinceMonday - 1);

    const start = new Date(end);
    start.setDate(end.getDate() - 6);

    return {
      from: formatDateInput(start),
      to: formatDateInput(end),
      label: `${start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} to ${end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      explanation: 'Previous full Monday-Sunday week',
    };
  }

  const end = new Date(today.getFullYear(), today.getMonth(), 0);
  const start = new Date(end.getFullYear(), end.getMonth(), 1);

  return {
    from: formatDateInput(start),
    to: formatDateInput(end),
    label: `${start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} to ${end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    explanation: 'Previous full calendar month',
  };
}

function getNextRun(schedule: ExportSchedule) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(9, 0, 0, 0);

  if (schedule.frequency === 'weekly') {
    const dayDelta = (1 - next.getDay() + 7) % 7;
    next.setDate(next.getDate() + dayDelta);
    if (next <= now) next.setDate(next.getDate() + 7);
    return next;
  }

  next.setDate(1);
  if (next <= now) {
    next.setMonth(next.getMonth() + 1, 1);
  }
  return next;
}

function scheduleDescription(schedule: ExportSchedule) {
  if (schedule.frequency === 'weekly') {
    return 'Weekly email every Monday at 09:00 with the previous full week';
  }
  return 'Monthly email on the 1st at 09:00 with the previous full month';
}

export default function ReportsClient({
  companyId,
  initialSessions,
  total,
  members,
  policies,
  from,
  to,
  employeeId,
  department,
  billingMode,
  policyId,
}: {
  companyId: string;
  initialSessions: Session[];
  total: number;
  members: Member[];
  policies: Policy[];
  from: string;
  to: string;
  employeeId: string;
  department: string;
  billingMode: string;
  policyId: string;
}) {
  const t = useT();
  const tr = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const pathname = usePathname();
  const router = useRouter();
  const [filters, setFilters] = useState<ReportFilters>({
    from,
    to,
    employeeId,
    department,
    billingMode,
    policyId,
  });
  const [exporting, setExporting] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [schedules, setSchedules] = useState<ExportSchedule[]>([]);
  const [viewName, setViewName] = useState('');
  const [scheduleName, setScheduleName] = useState('');
  const [scheduleEmail, setScheduleEmail] = useState('');
  const [scheduleFrequency, setScheduleFrequency] = useState<'weekly' | 'monthly'>('weekly');
  const [feedback, setFeedback] = useState('');

  const savedViewsKey = `tappy-reports:${companyId}:saved-views`;
  const schedulesKey = `tappy-reports:${companyId}:scheduled-exports`;

  useEffect(() => {
    setFilters({
      from,
      to,
      employeeId,
      department,
      billingMode,
      policyId,
    });
  }, [from, to, employeeId, department, billingMode, policyId]);

  useEffect(() => {
    try {
      const rawViews = localStorage.getItem(savedViewsKey);
      const rawSchedules = localStorage.getItem(schedulesKey);
      setSavedViews(rawViews ? (JSON.parse(rawViews) as SavedView[]) : []);
      setSchedules(
        rawSchedules
          ? (JSON.parse(rawSchedules) as ExportSchedule[]).map((schedule) => ({
              ...schedule,
              recipientEmail: schedule.recipientEmail ?? '',
            }))
          : [],
      );
    } catch {
      setSavedViews([]);
      setSchedules([]);
    }
  }, [savedViewsKey, schedulesKey]);

  useEffect(() => {
    let active = true;

    const loadEmail = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { email?: string | null };
        if (active && data.email) {
          setScheduleEmail((current) => current || data.email || '');
        }
      } catch {
        // Ignore email prefill failures and keep manual entry available.
      }
    };

    void loadEmail();

    return () => {
      active = false;
    };
  }, []);

  const membersById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  );
  const membersByEmail = useMemo(
    () =>
      new Map(
        members
          .filter((member) => member.user_email)
          .map((member) => [member.user_email.trim().toLowerCase(), member]),
      ),
    [members],
  );

  const departments = useMemo(
    () =>
      Array.from(
        new Set(
          members
            .map((member) => member.department_name?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [members],
  );

  const employees = useMemo(
    () =>
      [...members].sort((left, right) =>
        (left.user_name ?? left.user_email).localeCompare(right.user_name ?? right.user_email),
      ),
    [members],
  );

  const enrichedSessions = useMemo<EnrichedSession[]>(
    () =>
      initialSessions.map((session) => {
        const matchedMember =
          (session.employee_id ? membersById.get(session.employee_id) : undefined) ??
          membersByEmail.get(session.employee_email.trim().toLowerCase());

        return {
          ...session,
          resolved_employee_id: session.employee_id ?? matchedMember?.id ?? '',
          resolved_department: session.department_name ?? matchedMember?.department_name ?? '',
          resolved_policy_id: session.policy_id ?? matchedMember?.policy_id ?? '',
          resolved_policy_name: session.policy_name ?? matchedMember?.policy_name ?? '',
        };
      }),
    [initialSessions, membersByEmail, membersById],
  );

  const filteredSessions = useMemo(
    () =>
      enrichedSessions.filter((session) => {
        if (filters.employeeId && session.resolved_employee_id !== filters.employeeId) return false;
        if (filters.department && session.resolved_department !== filters.department) return false;
        if (filters.billingMode && session.billing_mode !== filters.billingMode) return false;
        if (filters.policyId && session.resolved_policy_id !== filters.policyId) return false;
        return true;
      }),
    [enrichedSessions, filters],
  );

  const activeQuery = buildSearchParams(filters).toString();
  const totalLabel =
    filteredSessions.length === total
      ? `${filteredSessions.length} ${tr('sessions_total_plural', 'sessions total')}`
      : `${filteredSessions.length} shown of ${total}`;

  const persistSavedViews = (nextViews: SavedView[]) => {
    setSavedViews(nextViews);
    localStorage.setItem(savedViewsKey, JSON.stringify(nextViews));
  };

  const persistSchedules = (nextSchedules: ExportSchedule[]) => {
    setSchedules(nextSchedules);
    localStorage.setItem(schedulesKey, JSON.stringify(nextSchedules));
  };

  const exportCsv = async (selectedFilters: ReportFilters = filters, fileStem = 'fleet-report') => {
    setExporting(true);
    setFeedback('');
    try {
      const qs = buildSearchParams(selectedFilters).toString();
      const res = await fetch(`/api/fleet/${companyId}/reports/sessions/export${qs ? `?${qs}` : ''}`);
      if (!res.ok) {
        setFeedback('Export failed. Please try again.');
        return;
      }
      const blob = await res.blob();
      downloadBlob(blob, `${fileStem}.csv`);
      setFeedback('CSV export started.');
    } finally {
      setExporting(false);
    }
  };

  const applyFilters = () => {
    const qs = buildSearchParams(filters).toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const resetFilters = () => {
    const clearedFilters = {
      from: '',
      to: '',
      employeeId: '',
      department: '',
      billingMode: '',
      policyId: '',
    };
    setFilters(clearedFilters);
    startTransition(() => {
      router.push(pathname);
    });
  };

  const saveCurrentView = () => {
    const name = viewName.trim();
    if (!name) {
      setFeedback('Add a name before saving this view.');
      return;
    }

    const nextView: SavedView = {
      id: crypto.randomUUID(),
      name,
      filters: { ...filters },
      createdAt: new Date().toISOString(),
    };
    persistSavedViews([nextView, ...savedViews]);
    setViewName('');
    setFeedback(`Saved view "${name}".`);
  };

  const applySavedView = (view: SavedView) => {
    setFilters(view.filters);
    const qs = buildSearchParams(view.filters).toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const deleteSavedView = (id: string) => {
    persistSavedViews(savedViews.filter((view) => view.id !== id));
  };

  const saveSchedule = () => {
    const name = scheduleName.trim();
    if (!name) {
      setFeedback('Add a schedule name before saving.');
      return;
    }
    const recipientEmail = scheduleEmail.trim();
    if (!recipientEmail) {
      setFeedback('Add the email address that should receive this CSV.');
      return;
    }

    const nextSchedule: ExportSchedule = {
      id: crypto.randomUUID(),
      name,
      filters: { ...filters },
      recipientEmail,
      frequency: scheduleFrequency,
      createdAt: new Date().toISOString(),
    };
    persistSchedules([nextSchedule, ...schedules]);
    setScheduleName('');
    setFeedback(`Saved email export "${name}" on this device.`);
  };

  const deleteSchedule = (id: string) => {
    persistSchedules(schedules.filter((schedule) => schedule.id !== id));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{tr('page_reports', 'Session Reports')}</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Filter by employee, department, billing mode, and policy, then save common report setups for quick reuse.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void exportCsv()}
          disabled={exporting}
          className={fleetButtonClass('primary', 'md', 'w-full sm:w-auto')}
        >
          <Download size={16} strokeWidth={2.2} />
          {exporting ? tr('btn_exporting', 'Exporting...') : tr('btn_export_csv', 'Export CSV')}
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <section className="space-y-6">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              applyFilters();
            }}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 sm:p-5"
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <DatePicker
                label={tr('label_from', 'From')}
                value={filters.from}
                onChange={(value) => setFilters((current) => ({ ...current, from: value }))}
              />
              <DatePicker
                label={tr('label_to', 'To')}
                value={filters.to}
                onChange={(value) => setFilters((current) => ({ ...current, to: value }))}
              />
              <FilterSelect
                label="Employee"
                value={filters.employeeId}
                onChange={(value) => setFilters((current) => ({ ...current, employeeId: value }))}
                options={[
                  { value: '', label: 'All employees' },
                  ...employees.map((member) => ({
                    value: member.id,
                    label: member.user_name ?? member.user_email,
                  })),
                ]}
              />
              <FilterSelect
                label="Department"
                value={filters.department}
                onChange={(value) => setFilters((current) => ({ ...current, department: value }))}
                options={[
                  { value: '', label: 'All departments' },
                  ...departments.map((name) => ({ value: name, label: name })),
                ]}
              />
              <FilterSelect
                label="Billing mode"
                value={filters.billingMode}
                onChange={(value) => setFilters((current) => ({ ...current, billingMode: value }))}
                options={BILLING_MODE_OPTIONS}
              />
              <FilterSelect
                label="Policy"
                value={filters.policyId}
                onChange={(value) => setFilters((current) => ({ ...current, policyId: value }))}
                options={[
                  { value: '', label: 'All policies' },
                  ...policies.map((policy) => ({ value: policy.id, label: policy.name })),
                ]}
              />
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="submit"
                className={fleetButtonClass('secondary', 'md', 'w-full sm:w-auto')}
              >
                <Filter size={16} strokeWidth={2.2} />
                {tr('btn_apply', 'Apply')}
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className={fleetButtonClass('subtle', 'md', 'w-full sm:w-auto')}
              >
                Reset
              </button>
              <div className="text-sm text-zinc-400">{totalLabel}</div>
            </div>

            {feedback && (
              <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                {feedback}
              </div>
            )}
          </form>

          <div className="hidden overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="px-4 py-3 text-left">{tr('col_employee', 'Employee')}</th>
                    <th className="px-4 py-3 text-left">Department</th>
                    <th className="px-4 py-3 text-left">{tr('col_station', 'Station')}</th>
                    <th className="px-4 py-3 text-left">{tr('col_date', 'Date')}</th>
                    <th className="px-4 py-3 text-left">{tr('col_kwh', 'kWh')}</th>
                    <th className="px-4 py-3 text-left">{tr('col_cost', 'Cost')}</th>
                    <th className="px-4 py-3 text-left">{tr('col_billing', 'Billing')}</th>
                    <th className="px-4 py-3 text-left">Policy</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((session) => (
                    <tr key={session.session_id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
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
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            session.billing_mode === 'COMPANY_PAID'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          {formatBillingMode(
                            session.billing_mode,
                            tr('badge_company', 'Company'),
                            tr('badge_reimbursable', 'Reimbursable'),
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-300">{session.resolved_policy_name || '-'}</td>
                    </tr>
                  ))}
                  {filteredSessions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-zinc-500">
                        {tr('no_sessions', 'No sessions found for the selected period.')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3 md:hidden">
            {filteredSessions.length === 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-10 text-center text-zinc-500">
                {tr('no_sessions', 'No sessions found for the selected period.')}
              </div>
            )}
            {filteredSessions.map((session) => (
              <article key={session.session_id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-white">{session.employee_name}</h2>
                    <p className="mt-1 break-all text-sm text-zinc-500">{session.employee_email}</p>
                  </div>
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      session.billing_mode === 'COMPANY_PAID'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {formatBillingMode(
                      session.billing_mode,
                      tr('badge_company', 'Company'),
                      tr('badge_reimbursable', 'Reimbursable'),
                    )}
                  </span>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <MobileRow label="Department" value={session.resolved_department || '-'} />
                  <MobileRow label={tr('col_station', 'Station')} value={session.station_name} />
                  <MobileRow label={tr('col_date', 'Date')} value={formatDate(session.started_at)} />
                  <MobileRow label={tr('col_kwh', 'kWh')} value={session.delivered_kwh.toFixed(2)} />
                  <MobileRow label={tr('col_cost', 'Cost')} value={formatCurrency(session.total_cost_cents)} />
                  <MobileRow label="Policy" value={session.resolved_policy_name || '-'} />
                </dl>
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2 text-white">
              <Save size={16} />
              <h2 className="font-semibold">Saved views</h2>
            </div>
            <p className="mb-4 text-sm text-zinc-400">
              Store common filter combinations in this browser for faster reporting.
            </p>
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs text-zinc-400">View name</span>
                <input
                  value={viewName}
                  onChange={(event) => setViewName(event.target.value)}
                  placeholder="Month-end finance pack"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#33d6c5]"
                />
              </label>
              <button
                type="button"
                onClick={saveCurrentView}
                className={fleetButtonClass('secondary', 'md', 'w-full')}
              >
                <Save size={16} strokeWidth={2.1} />
                Save current view
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {savedViews.length === 0 && (
                <div className="rounded-xl border border-dashed border-zinc-700 px-3 py-4 text-sm text-zinc-500">
                  No saved views yet.
                </div>
              )}
              {savedViews.map((view) => (
                <div key={view.id} className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">{view.name}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {describeFilters(view.filters, members, policies)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteSavedView(view.id)}
                      className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
                      aria-label={`Delete saved view ${view.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => applySavedView(view)}
                    className={fleetButtonClass('subtle', 'sm', 'mt-3 w-full')}
                  >
                    Apply view
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2 text-white">
              <CalendarClock size={16} />
              <h2 className="font-semibold">Scheduled exports</h2>
            </div>
            <p className="mb-4 text-sm text-zinc-400">
              Save a reusable email export preset in this browser. Weekly sends always use the previous full Monday-Sunday week, and monthly sends use the previous full calendar month.
            </p>
            <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-3 text-sm text-amber-100">
              Automatic background emailing is not wired up in this frontend yet, so these presets stay on this device for now.
            </div>
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs text-zinc-400">Schedule name</span>
                <input
                  value={scheduleName}
                  onChange={(event) => setScheduleName(event.target.value)}
                  placeholder="Weekly finance export"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#33d6c5]"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs text-zinc-400">Email address</span>
                <input
                  type="email"
                  value={scheduleEmail}
                  onChange={(event) => setScheduleEmail(event.target.value)}
                  placeholder="finance@company.com"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#33d6c5]"
                />
              </label>
              <div className="grid gap-3">
                <FilterSelect
                  label="Frequency"
                  value={scheduleFrequency}
                  onChange={(value) => setScheduleFrequency(value as 'weekly' | 'monthly')}
                  options={[
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                  ]}
                />
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-3 text-sm text-zinc-400">
                {scheduleFrequency === 'weekly'
                  ? 'Weekly exports are prepared every Monday at 09:00 and include the full week that just closed.'
                  : 'Monthly exports are prepared on the 1st at 09:00 and include the full previous calendar month.'}
              </div>
              <button
                type="button"
                onClick={saveSchedule}
                className={fleetButtonClass('secondary', 'md', 'w-full')}
              >
                <CalendarClock size={16} strokeWidth={2.1} />
                Save schedule
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {schedules.length === 0 && (
                <div className="rounded-xl border border-dashed border-zinc-700 px-3 py-4 text-sm text-zinc-500">
                  No schedules saved yet.
                </div>
              )}
              {schedules.map((schedule) => (
                <div key={schedule.id} className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">{schedule.name}</div>
                      <div className="mt-1 text-xs text-zinc-500">{scheduleDescription(schedule)}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        Next run {getNextRun(schedule).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">Recipient {schedule.recipientEmail}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        Data window {getPreviousClosedPeriod(schedule.frequency).label}
                      </div>
                      <div className="mt-2 text-xs text-zinc-500">
                        {describeFilters(schedule.filters, members, policies)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteSchedule(schedule.id)}
                      className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
                      aria-label={`Delete scheduled export ${schedule.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => applySavedView({ id: schedule.id, name: schedule.name, filters: schedule.filters, createdAt: schedule.createdAt })}
                      className={fleetButtonClass('subtle', 'sm', 'w-full')}
                    >
                      Load filters
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const period = getPreviousClosedPeriod(schedule.frequency);
                        void exportCsv(
                          {
                            ...schedule.filters,
                            from: period.from,
                            to: period.to,
                          },
                          schedule.name.toLowerCase().replace(/\s+/g, '-'),
                        );
                      }}
                      className={fleetButtonClass('secondary', 'sm', 'w-full')}
                    >
                      Run export now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function describeFilters(filters: ReportFilters, members: Member[], policies: Policy[]) {
  const employee = members.find((member) => member.id === filters.employeeId);
  const policy = policies.find((item) => item.id === filters.policyId);
  const parts = [
    employee ? employee.user_name ?? employee.user_email : '',
    filters.department,
    filters.billingMode ? filters.billingMode.replace(/_/g, ' ').toLowerCase() : '',
    policy?.name ?? '',
    filters.from || filters.to ? [filters.from, filters.to].filter(Boolean).join(' to ') : '',
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' | ') : 'All sessions';
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-zinc-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#33d6c5]"
      >
        {options.map((option) => (
          <option key={`${label}-${option.value || 'all'}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
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
