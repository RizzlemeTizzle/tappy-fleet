import Link from 'next/link';
import {
  BatteryCharging,
  ReceiptText,
  ShieldCheck,
  Users,
  UsersRound,
  Zap,
} from 'lucide-react';
import { BrandIcon } from '@/components/BrandIcon';
import { apiFetch } from '@/lib/apiFetch';

interface OverviewData {
  active_members: number;
  sessions_this_month: number;
  spend_this_month_cents: number;
  kwh_this_month: number;
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export default async function FleetOverviewPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const res = await apiFetch(`/fleet/companies/${companyId}/reports/overview`);
  const overview: OverviewData = res.ok
    ? await res.json()
    : { active_members: 0, sessions_this_month: 0, spend_this_month_cents: 0, kwh_this_month: 0 };

  const kpis = [
    { label: 'Active Members', value: String(overview.active_members), icon: UsersRound, tone: 'violet' as const },
    { label: 'Sessions This Month', value: String(overview.sessions_this_month), icon: Zap, tone: 'teal' as const },
    { label: 'Spend This Month', value: formatCurrency(overview.spend_this_month_cents), icon: ReceiptText, tone: 'violet' as const },
    { label: 'kWh This Month', value: `${overview.kwh_this_month.toFixed(1)} kWh`, icon: BatteryCharging, tone: 'teal' as const },
  ];

  const quickLinks = [
    {
      href: 'employees',
      label: 'Manage employees',
      desc: 'Invite and assign policies',
      icon: Users,
      tone: 'teal' as const,
    },
    {
      href: 'billing',
      label: 'View invoices',
      desc: 'Download PDF invoices',
      icon: ReceiptText,
      tone: 'violet' as const,
    },
    {
      href: 'reports',
      label: 'Session reports',
      desc: 'Filter and export CSV',
      icon: ShieldCheck,
      tone: 'mixed' as const,
    },
  ];

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-white">Overview</h1>

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-white/10 bg-white/[0.05] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
          >
            <BrandIcon icon={kpi.icon} tone={kpi.tone} className="mb-4 h-12 w-12" size={22} />
            <div className="text-2xl font-bold text-white">{kpi.value}</div>
            <div className="mt-1 text-sm text-zinc-400">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.05] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <h2 className="mb-4 text-lg font-semibold text-white">Quick links</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={`/fleet/${companyId}/${link.href}`}
              className="block rounded-lg bg-white/[0.06] p-4 transition-colors hover:bg-white/[0.09]"
            >
              <BrandIcon icon={link.icon} tone={link.tone} className="mb-3 h-11 w-11" size={20} />
              <div className="font-medium text-white">{link.label}</div>
              <div className="mt-0.5 text-sm text-zinc-400">{link.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
