'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BatteryCharging,
  ClipboardList,
  Euro,
  FileText,
  ReceiptText,
  ShieldAlert,
  type LucideIcon,
  Users,
  UsersRound,
  Zap,
} from 'lucide-react';
import {
  FleetCard,
  FleetPageHeader,
  MetricCard,
  StatusPill,
} from '@/components/fleet/FleetDashboard';
import { fleetButtonClass } from '@/lib/fleet-ui';
import { useT } from '@/lib/i18n';

export interface OverviewData {
  company_name?: string | null;
  period_label?: string | null;
  active_members: number;
  invited_members?: number;
  members_missing_policy?: number;
  sessions_this_month: number;
  sessions_previous_month?: number;
  spend_this_month_cents: number;
  spend_previous_month_cents?: number;
  kwh_this_month: number;
  kwh_previous_month?: number;
  sessions_all_time?: number;
  policy_violations_this_month?: number;
  policy_violations_previous_month?: number;
  pending_reimbursements?: number;
  overdue_invoices?: number;
  draft_invoices?: number;
}

interface Props {
  companyId: string;
  overview: OverviewData;
}

interface ActionItem {
  label: string;
  description: string;
  href: string;
  value: number;
  icon: LucideIcon;
  tone: 'teal' | 'violet' | 'amber' | 'red' | 'blue' | 'neutral';
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDelta(current: number, previous?: number, unit = '') {
  if (previous == null) return 'New this month';
  const diff = current - previous;
  if (diff === 0) return 'No change';
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff.toLocaleString('en-GB')}${unit} vs last month`;
}

function formatCurrencyDelta(current: number, previous?: number) {
  if (previous == null) return 'New this month';
  const diff = current - previous;
  if (diff === 0) return 'No change';
  const sign = diff > 0 ? '+' : '';
  return `${sign}${formatCurrency(diff)} vs last month`;
}

export function OverviewClient({ companyId, overview }: Props) {
  const t = useT();
  const tr = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const base = `/fleet/${companyId}`;
  const policyViolations = overview.policy_violations_this_month ?? 0;
  const attentionItems: ActionItem[] = [
    {
      label: 'Pending reimbursements',
      description: 'Requests waiting for finance review.',
      href: `${base}/reimbursements`,
      value: overview.pending_reimbursements ?? 0,
      icon: ClipboardList,
      tone: 'amber',
    },
    {
      label: 'Policy violations',
      description: 'Charging sessions outside the configured rules.',
      href: `${base}/reports`,
      value: policyViolations,
      icon: ShieldAlert,
      tone: policyViolations > 0 ? 'red' : 'teal',
    },
    {
      label: 'Overdue invoices',
      description: 'Invoices that need payment follow-up.',
      href: `${base}/billing`,
      value: overview.overdue_invoices ?? 0,
      icon: ReceiptText,
      tone: 'red',
    },
  ];

  const visibleAttentionItems = attentionItems.filter((item) => item.value > 0);

  const quickActions: ActionItem[] = [
    {
      label: tr('ql_employees', 'Employees'),
      description: tr('ql_employees_desc', 'Invite people, assign billing modes, and keep policies aligned.'),
      href: `${base}/employees`,
      value: overview.invited_members ?? 0,
      icon: Users,
      tone: 'teal',
    },
    {
      label: tr('ql_billing', 'Billing'),
      description: tr('ql_billing_desc', 'Review invoices and download finance-ready PDFs.'),
      href: `${base}/billing`,
      value: overview.draft_invoices ?? 0,
      icon: FileText,
      tone: 'blue',
    },
    {
      label: tr('ql_reports', 'Reports'),
      description: tr('ql_reports_desc', 'Filter charging sessions and export CSVs.'),
      href: `${base}/reports`,
      value: overview.sessions_all_time ?? 0,
      icon: BarChart3,
      tone: 'violet',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <FleetPageHeader
        eyebrow={overview.period_label ?? 'Fleet dashboard'}
        title={overview.company_name ?? tr('nav_overview', 'Overview')}
        description="Monitor fleet charging, spot finance work, and jump straight into the queues that need attention."
        actions={
          <>
            <Link href={`${base}/reports`} className={fleetButtonClass('secondary', 'md', 'w-full sm:w-auto')}>
              <BarChart3 size={16} strokeWidth={2.2} />
              Export report
            </Link>
            <Link href={`${base}/reimbursements`} className={fleetButtonClass('primary', 'md', 'w-full sm:w-auto')}>
              <ClipboardList size={16} strokeWidth={2.2} />
              Review queue
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label={tr('kpi_active_members', 'Active members')}
          value={overview.active_members.toLocaleString('en-GB')}
          hint={`${overview.invited_members ?? 0} invited`}
          icon={UsersRound}
          tone="violet"
        />
        <MetricCard
          label={tr('kpi_sessions_month', 'Sessions this month')}
          value={overview.sessions_this_month.toLocaleString('en-GB')}
          delta={formatDelta(overview.sessions_this_month, overview.sessions_previous_month)}
          icon={Zap}
          tone="teal"
        />
        <MetricCard
          label={tr('kpi_spend_month', 'Spend this month')}
          value={formatCurrency(overview.spend_this_month_cents)}
          delta={formatCurrencyDelta(overview.spend_this_month_cents, overview.spend_previous_month_cents)}
          icon={Euro}
          tone="blue"
        />
        <MetricCard
          label={tr('kpi_kwh_month', 'Energy this month')}
          value={`${overview.kwh_this_month.toFixed(1)} kWh`}
          delta={formatDelta(
            Math.round(overview.kwh_this_month),
            overview.kwh_previous_month == null ? undefined : Math.round(overview.kwh_previous_month),
            ' kWh',
          )}
          icon={BatteryCharging}
          tone="teal"
        />
        <MetricCard
          label="Policy violations"
          value={String(policyViolations)}
          delta={formatDelta(policyViolations, overview.policy_violations_previous_month)}
          icon={AlertTriangle}
          tone={policyViolations > 0 ? 'amber' : 'neutral'}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <FleetCard className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Needs attention</h2>
              <p className="mt-1 text-sm text-zinc-400">The items most likely to block finance or policy hygiene.</p>
            </div>
            <StatusPill tone={visibleAttentionItems.length > 0 ? 'amber' : 'teal'}>
              {visibleAttentionItems.length > 0 ? `${visibleAttentionItems.length} active` : 'All clear'}
            </StatusPill>
          </div>

          <div className="mt-5 divide-y divide-white/10">
            {(visibleAttentionItems.length > 0 ? visibleAttentionItems : attentionItems.slice(0, 3)).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group flex items-center gap-4 py-4 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#33d6c5]/60"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-zinc-200">
                    <Icon size={18} strokeWidth={2.1} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-white">{item.label}</span>
                      <StatusPill tone={item.value > 0 ? item.tone : 'teal'}>
                        {item.value.toLocaleString('en-GB')}
                      </StatusPill>
                    </span>
                    <span className="mt-1 block text-sm text-zinc-400">{item.description}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-white" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </FleetCard>

        <FleetCard className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#33d6c5]/20 bg-[#33d6c5]/10 text-[#7ce9de]">
              <BatteryCharging size={18} strokeWidth={2.1} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">Fleet health</h2>
              <p className="text-sm text-zinc-400">A quick read on the month so far.</p>
            </div>
          </div>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-zinc-400">All-time sessions</dt>
              <dd className="font-medium text-white">{(overview.sessions_all_time ?? 0).toLocaleString('en-GB')}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-zinc-400">Draft invoices</dt>
              <dd className="font-medium text-white">{(overview.draft_invoices ?? 0).toLocaleString('en-GB')}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-zinc-400">Invited members</dt>
              <dd className="font-medium text-white">{(overview.invited_members ?? 0).toLocaleString('en-GB')}</dd>
            </div>
          </dl>
        </FleetCard>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <FleetCard key={action.href} as="article" className="p-5 transition-colors hover:border-white/16 hover:bg-white/[0.07]">
              <Link href={action.href} className="group block outline-none focus-visible:ring-2 focus-visible:ring-[#33d6c5]/60">
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white">
                    <Icon size={19} strokeWidth={2.1} aria-hidden="true" />
                  </span>
                  <ArrowRight className="h-4 w-4 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-white" aria-hidden="true" />
                </div>
                <h2 className="mt-4 font-semibold text-white">{action.label}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{action.description}</p>
              </Link>
            </FleetCard>
          );
        })}
      </div>
    </div>
  );
}
