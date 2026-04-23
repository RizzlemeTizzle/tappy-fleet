'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface Props {
  companyId: string;
  companyName: string;
  role: string;
}

const allNavItems = [
  { label: 'Overview',   path: '',           icon: '📊', roles: ['FLEET_OWNER', 'FLEET_ADMIN', 'FINANCE_ADMIN'] },
  { label: 'Employees',  path: '/employees', icon: '👥', roles: ['FLEET_OWNER', 'FLEET_ADMIN'] },
  { label: 'Policies',   path: '/policies',  icon: '📋', roles: ['FLEET_OWNER', 'FLEET_ADMIN'] },
  { label: 'Billing',    path: '/billing',   icon: '💳', roles: ['FLEET_OWNER', 'FLEET_ADMIN', 'FINANCE_ADMIN'] },
  { label: 'Reports',    path: '/reports',   icon: '📈', roles: ['FLEET_OWNER', 'FLEET_ADMIN', 'FINANCE_ADMIN'] },
  { label: 'Audit Log',  path: '/audit',     icon: '🔍', roles: ['FLEET_OWNER', 'FLEET_ADMIN', 'FINANCE_ADMIN'] },
];

export default function FleetSidebar({ companyId, companyName, role }: Props) {
  const navItems = allNavItems.filter((item) => item.roles.includes(role));
  const pathname = usePathname();
  const router = useRouter();
  const base = `/fleet/${companyId}`;

  const handleLogout = async () => {
    await fetch('/api/auth/clear-cookie', { method: 'POST' });
    router.push('/auth/login');
  };

  return (
    <aside className="w-60 shrink-0 bg-[#070b11] border-r border-white/10 flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-white/10">
        <div className="font-bold text-lg bg-gradient-to-r from-[#7c5cff] to-[#33d6c5] bg-clip-text text-transparent">
          ⚡ TapCharge
        </div>
        <div className="text-zinc-400 text-sm mt-1 truncate">{companyName}</div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const href = `${base}${item.path}`;
          const isActive = item.path === ''
            ? pathname === base
            : pathname.startsWith(href);
          return (
            <Link
              key={item.path}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#7c5cff]/15 text-[#7c5cff]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/8'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-white/10">
        <Link
          href="/fleet"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/8 transition-colors"
        >
          <span>🏢</span> All organizations
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors mt-1"
        >
          <span>🚪</span> Sign out
        </button>
      </div>
    </aside>
  );
}
