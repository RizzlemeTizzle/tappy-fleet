import type { ExportSchedule, Member, Policy, ReportFilters } from './types';

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatBillingMode(value: string, companyLabel: string, reimbursableLabel: string) {
  if (value === 'COMPANY_PAID') return companyLabel;
  if (value === 'EMPLOYEE_REIMBURSABLE') return reimbursableLabel;
  return value.replace(/_/g, ' ');
}

export function buildSearchParams(filters: ReportFilters) {
  const qs = new URLSearchParams();
  if (filters.from) qs.set('from', filters.from);
  if (filters.to) qs.set('to', filters.to);
  if (filters.employeeId) qs.set('employeeId', filters.employeeId);
  if (filters.department) qs.set('department', filters.department);
  if (filters.billingMode) qs.set('billingMode', filters.billingMode);
  if (filters.policyId) qs.set('policyId', filters.policyId);
  return qs;
}

export function downloadBlob(blob: Blob, fileName: string) {
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

export function getPreviousClosedPeriod(frequency: ExportSchedule['frequency']) {
  const today = new Date();
  const currentDay = today.getDay();
  const displayDate = (date: Date) =>
    date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  if (frequency === 'weekly') {
    const end = new Date(today);
    const daysSinceMonday = (currentDay + 6) % 7;
    end.setDate(today.getDate() - daysSinceMonday - 1);

    const start = new Date(end);
    start.setDate(end.getDate() - 6);

    return {
      from: formatDateInput(start),
      to: formatDateInput(end),
      label: `${displayDate(start)} to ${displayDate(end)}`,
    };
  }

  const end = new Date(today.getFullYear(), today.getMonth(), 0);
  const start = new Date(end.getFullYear(), end.getMonth(), 1);

  return {
    from: formatDateInput(start),
    to: formatDateInput(end),
    label: `${displayDate(start)} to ${displayDate(end)}`,
  };
}

export function getNextRun(schedule: ExportSchedule) {
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

export function scheduleDescription(schedule: ExportSchedule) {
  if (schedule.frequency === 'weekly') {
    return 'Weekly email every Monday at 09:00 with the previous full week';
  }
  return 'Monthly email on the 1st at 09:00 with the previous full month';
}

export function describeFilters(filters: ReportFilters, members: Member[], policies: Policy[]) {
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
