import { apiFetch } from '@/lib/apiFetch';

interface OverviewData {
  active_members: number;
  sessions_this_month: number;
  spend_this_month_cents: number;
  kwh_this_month: number;
}

function formatCurrency(cents: number) {
  return `€${(cents / 100).toFixed(2)}`;
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
    { label: 'Active Members', value: String(overview.active_members), icon: '👥' },
    { label: 'Sessions This Month', value: String(overview.sessions_this_month), icon: '⚡' },
    { label: 'Spend This Month', value: formatCurrency(overview.spend_this_month_cents), icon: '💶' },
    { label: 'kWh This Month', value: `${overview.kwh_this_month.toFixed(1)} kWh`, icon: '🔋' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Overview</h1>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="text-2xl mb-2">{kpi.icon}</div>
            <div className="text-2xl font-bold text-white">{kpi.value}</div>
            <div className="text-zinc-400 text-sm mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: 'employees', label: 'Manage employees', desc: 'Invite & assign policies' },
            { href: 'billing', label: 'View invoices', desc: 'Download PDF invoices' },
            { href: 'reports', label: 'Session reports', desc: 'Filter & export CSV' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block bg-zinc-800 hover:bg-zinc-700 rounded-lg p-4 transition-colors"
            >
              <div className="text-white font-medium">{link.label}</div>
              <div className="text-zinc-400 text-sm mt-0.5">{link.desc}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
