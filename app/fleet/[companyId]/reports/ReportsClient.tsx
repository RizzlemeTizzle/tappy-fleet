'use client';

import { startTransition, useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { FleetPageHeader } from '@/components/fleet/FleetDashboard';
import { fleetButtonClass } from '@/lib/fleet-ui';
import { useT } from '@/lib/i18n';
import { ReportsFilters } from './ReportsFilters';
import { SavedViewsPanel } from './SavedViewsPanel';
import { ScheduledExportsPanel } from './ScheduledExportsPanel';
import { SessionResults } from './SessionResults';
import { buildSearchParams, downloadBlob } from './reportUtils';
import type { EnrichedSession, ExportSchedule, Member, Policy, ReportFilters, SavedView, Session } from './types';

export default function ReportsClient({
  companyId,
  initialSessions,
  total,
  currentPage,
  totalPages,
  pageSize,
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
  currentPage: number;
  totalPages: number;
  pageSize: number;
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

  const goToPage = (page: number) => {
    const qs = buildSearchParams(filters);
    if (page > 1) qs.set('page', String(page));
    else qs.delete('page');
    const search = qs.toString();
    startTransition(() => {
      router.push(search ? `${pathname}?${search}` : pathname);
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
      <FleetPageHeader
        title={tr('page_reports', 'Session Reports')}
        description="Filter by employee, department, billing mode, and policy, then save common report setups for quick reuse."
        actions={
          <button
            type="button"
            onClick={() => void exportCsv()}
            disabled={exporting}
            className={fleetButtonClass('primary', 'md', 'w-full sm:w-auto')}
          >
            <Download size={16} strokeWidth={2.2} />
            {exporting ? tr('btn_exporting', 'Exporting...') : tr('btn_export_csv', 'Export CSV')}
          </button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <section className="space-y-6">
          <ReportsFilters
            filters={filters}
            employees={employees}
            departments={departments}
            policies={policies}
            totalLabel={totalLabel}
            feedback={feedback}
            tr={tr}
            onChange={setFilters}
            onApply={applyFilters}
            onReset={resetFilters}
          />
          <SessionResults
            sessions={filteredSessions}
            currentPage={currentPage}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            tr={tr}
            onPageChange={goToPage}
          />
        </section>

        <aside className="space-y-6">
          <SavedViewsPanel
            savedViews={savedViews}
            viewName={viewName}
            members={members}
            policies={policies}
            onViewNameChange={setViewName}
            onSave={saveCurrentView}
            onApply={applySavedView}
            onDelete={deleteSavedView}
          />
          <ScheduledExportsPanel
            schedules={schedules}
            scheduleName={scheduleName}
            scheduleEmail={scheduleEmail}
            scheduleFrequency={scheduleFrequency}
            members={members}
            policies={policies}
            onScheduleNameChange={setScheduleName}
            onScheduleEmailChange={setScheduleEmail}
            onScheduleFrequencyChange={setScheduleFrequency}
            onSave={saveSchedule}
            onDelete={deleteSchedule}
            onApply={applySavedView}
            onExport={(selectedFilters, fileStem) => void exportCsv(selectedFilters, fileStem)}
          />
        </aside>
      </div>
    </div>
  );
}
