'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface Props {
  companyId: string;
  companyName: string;
}

const navItems = [
  { label: 'Overview', path: '', icon: '📊' },
  { label: 'Employees', path: '/employees', icon: '👥' },
  { label: 'Policies', path: '/policies', icon: '📋' },
  { label: 'Billing', path: '/billing', icon: '💳' },
  { label: 'Reports', path: '/reports', icon: '📈' },
  { label: 'Audit Log', path: '/audit', icon: '🔍' },
];

export default function FleetSidebar({ companyId, companyName }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/fleet/${companyId}`;

  const handleLogout = async () => {
    await fetch('/api/auth/clear-cookie', { method: 'POST' });
    router.push('/auth/login');
  };

  return (
    <aside className="w-60 shrink-0 bg-zinc-950 border-r border-zinc-800 flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-zinc-800">
        <div className="text-[#4CAF50] font-bold text-lg">⚡ TapCharge</div>
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
                  ? 'bg-[#4CAF50]/15 text-[#4CAF50]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-zinc-800">
        <Link
          href="/fleet"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
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
