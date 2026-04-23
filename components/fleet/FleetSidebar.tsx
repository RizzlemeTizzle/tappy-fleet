'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BrandIcon } from '@/components/BrandIcon';
import { fleetNavIcons } from '@/components/fleet/fleet-icons';
import TappyLogo from '@/components/TappyLogo';

interface MembershipOption {
  id: string;
  company_id: string;
  company_name: string;
  role: string;
  status: string;
}

interface Props {
  companyId: string;
  companyName: string;
  role: string;
  memberships: MembershipOption[];
}

const allNavItems = [
  { label: 'Overview', path: '', icon: fleetNavIcons.overview, roles: ['FLEET_OWNER', 'FLEET_ADMIN', 'FINANCE_ADMIN'] },
  { label: 'Employees', path: '/employees', icon: fleetNavIcons.employees, roles: ['FLEET_OWNER', 'FLEET_ADMIN'] },
  { label: 'Policies', path: '/policies', icon: fleetNavIcons.policies, roles: ['FLEET_OWNER', 'FLEET_ADMIN'] },
  { label: 'Billing', path: '/billing', icon: fleetNavIcons.billing, roles: ['FLEET_OWNER', 'FLEET_ADMIN', 'FINANCE_ADMIN'] },
  { label: 'Reports', path: '/reports', icon: fleetNavIcons.reports, roles: ['FLEET_OWNER', 'FLEET_ADMIN', 'FINANCE_ADMIN'] },
  { label: 'Audit Log', path: '/audit', icon: fleetNavIcons.audit, roles: ['FLEET_OWNER', 'FLEET_ADMIN', 'FINANCE_ADMIN'] },
];

export default function FleetSidebar({ companyId, companyName, role, memberships }: Props) {
  const navItems = allNavItems.filter((item) => item.roles.includes(role));
  const pathname = usePathname();
  const router = useRouter();
  const base = `/fleet/${companyId}`;

  const handleLogout = async () => {
    await fetch('/api/auth/clear-cookie', { method: 'POST' });
    router.push('/auth/login');
  };

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-white/10 bg-[#070b11]">
      <div className="border-b border-white/10 p-5">
        <div className="flex items-center gap-3">
          <TappyLogo size={36} />
          <span className="text-base font-bold text-white">Tappy Charge</span>
        </div>
        <div className="mt-2 truncate text-sm text-zinc-400">{companyName}</div>
        {memberships.length > 1 && (
          <div className="mt-4">
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
              Switch organization
            </label>
            <select
              value={companyId}
              onChange={(e) => router.push(`/fleet/${e.target.value}`)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#33d6c5]"
            >
              {memberships.map((membership) => (
                <option key={membership.id} value={membership.company_id} className="bg-[#070b11]">
                  {membership.company_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const href = `${base}${item.path}`;
          const isActive = item.path === '' ? pathname === base : pathname.startsWith(href);

          return (
            <Link
              key={item.path}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#7c5cff]/15 text-[#7c5cff]'
                  : 'text-zinc-400 hover:bg-white/8 hover:text-white'
              }`}
            >
              <BrandIcon
                icon={item.icon}
                size={16}
                tone={isActive ? 'violet' : 'muted'}
                className="h-9 w-9"
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link
          href="/fleet"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-white/8 hover:text-white"
        >
          <BrandIcon icon={fleetNavIcons.hub} size={16} tone="muted" className="h-9 w-9" />
          All organizations
        </Link>
        <button
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <BrandIcon icon={fleetNavIcons.logout} size={16} tone="muted" className="h-9 w-9" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
