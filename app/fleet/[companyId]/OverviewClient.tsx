'use client';

import Link from 'next/link';
import {
  BarChart3,
  BatteryCharging,
  ReceiptText,
  type LucideIcon,
  Users,
  UsersRound,
  Zap,
} from 'lucide-react';
import { BrandIcon } from '@/components/BrandIcon';
import { useT } from '@/lib/i18n';

interface KpiData {
  label_key: string;
  value: string;
  icon: LucideIcon;
  tone: 'violet' | 'teal';
}

interface QuickLinkData {
  href: string;
  label_key: string;
  desc_key: string;
  icon: LucideIcon;
  tone: 'teal' | 'violet' | 'mixed';
}

interface Props {
  companyId: string;
  activeMembersValue: string;
  sessionsValue: string;
  spendValue: string;
  kwhValue: string;
}

export function OverviewClient({ companyId, activeMembersValue, sessionsValue, spendValue, kwhValue }: Props) {
  const t = useT();

  const kpis: KpiData[] = [
    { label_key: 'kpi_active_members',   value: activeMembersValue, icon: UsersRound,    tone: 'violet' },
    { label_key: 'kpi_sessions_month',   value: sessionsValue,      icon: Zap,           tone: 'teal'   },
    { label_key: 'kpi_spend_month',      value: spendValue,         icon: ReceiptText,   tone: 'violet' },
    { label_key: 'kpi_kwh_month',        value: kwhValue,           icon: BatteryCharging, tone: 'teal' },
  ];

  const quickLinks: QuickLinkData[] = [
    { href: 'employees', label_key: 'ql_employees', desc_key: 'ql_employees_desc', icon: Users,      tone: 'teal'   },
    { href: 'billing',   label_key: 'ql_billing',   desc_key: 'ql_billing_desc',   icon: ReceiptText, tone: 'violet' },
    { href: 'reports',   label_key: 'ql_reports',   desc_key: 'ql_reports_desc',   icon: BarChart3,  tone: 'mixed'  },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="mb-6 text-2xl font-bold text-white">{t('nav_overview')}</h1>

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label_key}
            className="rounded-xl border border-white/10 bg-white/[0.05] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
          >
            <BrandIcon icon={kpi.icon} tone={kpi.tone} className="mb-4 h-12 w-12" size={22} />
            <div className="text-2xl font-bold text-white">{kpi.value}</div>
            <div className="mt-1 text-sm text-zinc-400">{t(kpi.label_key)}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.05] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <h2 className="mb-4 text-lg font-semibold text-white">{t('quick_links')}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={`/fleet/${companyId}/${link.href}`}
              className="block rounded-lg bg-white/[0.06] p-4 transition-colors hover:bg-white/[0.09]"
            >
              <BrandIcon icon={link.icon} tone={link.tone} className="mb-3 h-11 w-11" size={20} />
              <div className="font-medium text-white">{t(link.label_key)}</div>
              <div className="mt-0.5 text-sm text-zinc-400">{t(link.desc_key)}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
