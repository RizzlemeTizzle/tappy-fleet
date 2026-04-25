'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type MetricTone = 'teal' | 'violet' | 'amber' | 'red' | 'blue' | 'neutral';

const toneClasses: Record<MetricTone, { icon: string; value: string; badge: string }> = {
  teal: {
    icon: 'border-[#33d6c5]/25 bg-[#33d6c5]/12 text-[#7ce9de]',
    value: 'text-[#b5fff7]',
    badge: 'border-[#33d6c5]/25 bg-[#33d6c5]/10 text-[#8cf0e6]',
  },
  violet: {
    icon: 'border-[#8f7dff]/25 bg-[#8f7dff]/12 text-[#b7aaff]',
    value: 'text-[#d8d1ff]',
    badge: 'border-[#8f7dff]/25 bg-[#8f7dff]/10 text-[#c8bdff]',
  },
  amber: {
    icon: 'border-amber-400/25 bg-amber-400/12 text-amber-200',
    value: 'text-amber-100',
    badge: 'border-amber-400/25 bg-amber-400/10 text-amber-100',
  },
  red: {
    icon: 'border-red-400/25 bg-red-400/12 text-red-200',
    value: 'text-red-100',
    badge: 'border-red-400/25 bg-red-400/10 text-red-100',
  },
  blue: {
    icon: 'border-sky-400/25 bg-sky-400/12 text-sky-200',
    value: 'text-sky-100',
    badge: 'border-sky-400/25 bg-sky-400/10 text-sky-100',
  },
  neutral: {
    icon: 'border-white/12 bg-white/[0.06] text-zinc-200',
    value: 'text-white',
    badge: 'border-white/12 bg-white/[0.06] text-zinc-200',
  },
};

export function FleetPageHeader({
  title,
  eyebrow,
  description,
  actions,
  className,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7ce9de]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-bold text-white sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-col gap-2 sm:flex-row">{actions}</div>}
    </div>
  );
}

export function FleetCard({
  children,
  className,
  as: Component = 'section',
}: {
  children: ReactNode;
  className?: string;
  as?: 'section' | 'article' | 'div';
}) {
  return (
    <Component
      className={cn(
        'rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.065),rgba(255,255,255,0.035))] shadow-[0_16px_46px_rgba(0,0,0,0.22)]',
        className,
      )}
    >
      {children}
    </Component>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  delta,
  icon: Icon,
  tone = 'neutral',
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  delta?: string;
  icon: LucideIcon;
  tone?: MetricTone;
  className?: string;
}) {
  const classes = toneClasses[tone];

  return (
    <FleetCard as="article" className={cn('p-5', className)}>
      <div className="flex min-h-32 flex-col justify-between gap-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-zinc-400">{label}</p>
          <span className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border', classes.icon)}>
            <Icon size={18} strokeWidth={2.1} aria-hidden="true" />
          </span>
        </div>
        <div>
          <div className={cn('text-3xl font-bold tracking-normal', classes.value)}>{value}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {delta && (
              <span className={cn('rounded-full border px-2.5 py-1 text-xs font-medium', classes.badge)}>
                {delta}
              </span>
            )}
            {hint && <span className="text-xs text-zinc-500">{hint}</span>}
          </div>
        </div>
      </div>
    </FleetCard>
  );
}

export function StatusPill({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: MetricTone;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium', toneClasses[tone].badge, className)}>
      {children}
    </span>
  );
}
