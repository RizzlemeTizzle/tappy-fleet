'use client';

import { ShieldAlert } from 'lucide-react';
import { BrandIcon } from '@/components/BrandIcon';
import { useT } from '@/lib/i18n';

export function DashboardUnavailable() {
  const t = useT();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <div className="mb-4 flex justify-center">
          <BrandIcon icon={ShieldAlert} tone="violet" className="h-16 w-16" size={28} />
        </div>
        <h1 className="mb-2 text-xl font-bold text-white">{t('dashboard_unavailable_title')}</h1>
        <p className="text-sm text-zinc-400">{t('dashboard_unavailable_desc')}</p>
      </div>
    </div>
  );
}
