'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowRightLeft, Check, Menu, X } from 'lucide-react';
import { BrandIcon } from '@/components/BrandIcon';
import { fleetNavIcons } from '@/components/fleet/fleet-icons';
import TappyLogo from '@/components/TappyLogo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { fleetButtonClass } from '@/lib/fleet-ui';
import { useT } from '@/lib/i18n';

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

export default function FleetSidebar({ companyId, companyName, role, memberships }: Props) {
  const t = useT();
  const tr = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };
  const pathname = usePathname();
  const router = useRouter();
  const base = `/fleet/${companyId}`;
  const [showOrgMenu, setShowOrgMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const orgMenuRef = useRef<HTMLDivElement | null>(null);

  const allNavItems = [
    { key: 'nav_overview',   path: '',           icon: fleetNavIcons.overview,  roles: ['FLEET_OWNER', 'FLEET_ADMIN', 'FINANCE_ADMIN'] },
    { key: 'nav_employees',  path: '/employees', icon: fleetNavIcons.employees, roles: ['FLEET_OWNER', 'FLEET_ADMIN'] },
    { key: 'nav_policies',   path: '/policies',  icon: fleetNavIcons.policies,  roles: ['FLEET_OWNER', 'FLEET_ADMIN'] },
    { key: 'nav_billing',    path: '/billing',   icon: fleetNavIcons.billing,   roles: ['FLEET_OWNER', 'FLEET_ADMIN', 'FINANCE_ADMIN'] },
    { key: 'nav_reimbursements', path: '/reimbursements', icon: fleetNavIcons.reimbursements, roles: ['FLEET_OWNER', 'FLEET_ADMIN', 'FINANCE_ADMIN'] },
    { key: 'nav_reports',    path: '/reports',   icon: fleetNavIcons.reports,   roles: ['FLEET_OWNER', 'FLEET_ADMIN', 'FINANCE_ADMIN'] },
    { key: 'nav_audit_log',  path: '/audit',     icon: fleetNavIcons.audit,     roles: ['FLEET_OWNER', 'FLEET_ADMIN', 'FINANCE_ADMIN'] },
  ];

  const navItems = allNavItems.filter((item) => item.roles.includes(role));
  const otherMemberships = memberships.filter((membership) => membership.company_id !== companyId);

  useEffect(() => {
    if (!showOrgMenu) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!orgMenuRef.current?.contains(event.target as Node)) {
        setShowOrgMenu(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [showOrgMenu]);

  useEffect(() => {
    setShowOrgMenu(false);
    setShowMobileNav(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/clear-cookie', { method: 'POST' });
    router.push('/auth/login');
  };

  const renderOrgSwitcher = () => (
    <div className="mt-2 flex items-center gap-2" ref={orgMenuRef}>
      <div className="min-w-0 flex-1 truncate text-sm text-zinc-400">{companyName}</div>
      {otherMemberships.length > 0 && (
        <div className="relative">
          <button
            type="button"
            aria-label={t('label_switch_org')}
            aria-expanded={showOrgMenu}
            onClick={() => setShowOrgMenu((current) => !current)}
            className={fleetButtonClass('secondary', 'icon', 'h-8 w-8 rounded-full p-0')}
          >
            <ArrowRightLeft size={14} />
          </button>
          {showOrgMenu && (
            <div className="absolute left-0 top-11 z-30 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#0b1017] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
              <div className="px-2 pb-2 pt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                {t('label_switch_org')}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowOrgMenu(false);
                  router.push('/fleet');
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                <span>{t('nav_all_orgs')}</span>
              </button>
              {memberships.map((membership) => {
                const isCurrent = membership.company_id === companyId;

                return (
                  <button
                    key={membership.id}
                    type="button"
                    disabled={isCurrent}
                    onClick={() => {
                      if (isCurrent) return;
                      setShowOrgMenu(false);
                      router.push(`/fleet/${membership.company_id}`);
                    }}
                    className={`mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                      isCurrent
                        ? 'bg-white/[0.04] text-white'
                        : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{membership.company_name}</span>
                    {isCurrent && <Check size={14} className="shrink-0 text-[#9fd5ff]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderSidebarHeader = () => (
    <div className="border-b border-white/10 p-5">
      <div className="flex items-center gap-3">
        <TappyLogo size={36} />
        <span className="text-base font-bold text-white">Tappy Charge</span>
      </div>
      {renderOrgSwitcher()}
    </div>
  );

  const renderSidebarBody = () => (
    <>
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
                  ? 'border border-white/12 bg-[linear-gradient(135deg,rgba(143,125,255,0.18),rgba(109,137,255,0.14),rgba(51,214,197,0.12))] text-white shadow-[0_10px_26px_rgba(62,78,120,0.18)]'
                  : 'text-zinc-400 hover:bg-white/8 hover:text-white'
              }`}
            >
              <BrandIcon
                icon={item.icon}
                size={16}
                tone={isActive ? 'active' : 'muted'}
                className="h-9 w-9"
              />
              {tr(item.key, item.key === 'nav_reimbursements' ? 'Reimbursements' : item.key)}
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
          {t('nav_all_orgs')}
        </Link>
        <button
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <BrandIcon icon={fleetNavIcons.logout} size={16} tone="muted" className="h-9 w-9" />
          {t('nav_sign_out')}
        </button>
        <div className="mt-2 flex justify-start pl-1">
          <LanguageSwitcher />
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="sticky top-0 z-30 border-b border-white/10 bg-[linear-gradient(180deg,rgba(20,26,38,0.94),rgba(11,16,23,0.92))] backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => setShowMobileNav(true)}
            className={fleetButtonClass('secondary', 'icon', 'h-10 w-10 rounded-xl p-0')}
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <div className="truncate text-sm font-semibold text-white">{companyName}</div>
            <div className="text-xs text-zinc-500">Tappy Charge</div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center">
            <TappyLogo size={28} />
          </div>
        </div>
      </div>

      {showMobileNav && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowMobileNav(false)}
            aria-label="Close navigation overlay"
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col border-r border-white/10 bg-[linear-gradient(180deg,rgba(20,26,38,0.98),rgba(11,16,23,0.96))] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div className="flex items-center gap-3">
            <TappyLogo size={32} />
            <span className="text-base font-bold text-white">Tappy Charge</span>
          </div>
              <button
                type="button"
                onClick={() => setShowMobileNav(false)}
                className={fleetButtonClass('secondary', 'icon', 'h-9 w-9 rounded-xl p-0')}
                aria-label="Close navigation"
              >
                <X size={16} />
              </button>
            </div>
            {renderSidebarHeader()}
            {renderSidebarBody()}
          </div>
        </div>
      )}

      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-white/10 bg-[linear-gradient(180deg,rgba(20,26,38,0.98),rgba(11,16,23,0.96))] md:flex">
        {renderSidebarHeader()}
        {renderSidebarBody()}
      </aside>
    </>
  );
}
