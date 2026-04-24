'use client';

import { useMemo, useState } from 'react';
import { useT } from '@/lib/i18n';

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  performedByUserId: string | null;
  createdAt: string;
  changes: Record<string, unknown> | null;
}

interface MemberLookup {
  id: string;
  userId: string | null;
  name: string | null;
  email: string;
}

interface PolicyLookup {
  id: string;
  name: string;
}

interface InvoiceLookup {
  id: string;
  periodStart: string;
  totalCents: number;
  status: string;
}

interface Props {
  companyId: string;
  logs: AuditEntry[];
  members: MemberLookup[];
  policies: PolicyLookup[];
  invoices: InvoiceLookup[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatAction(action: string) {
  return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatFieldName(field: string) {
  return field.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ').trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function normalizeText(v: unknown): string {
  if (v == null || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '—';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.length === 0 ? '—' : v.map(normalizeText).join(', ');
  if (isRecord(v)) { try { return JSON.stringify(v); } catch { return '[object]'; } }
  return String(v);
}

interface DiffRow { field: string; before: unknown; after: unknown; }

function extractDiffRows(changes: Record<string, unknown> | null): DiffRow[] {
  if (!changes) return [];
  const b = isRecord(changes.before) ? changes.before : isRecord(changes.previous) ? changes.previous : isRecord(changes.old) ? changes.old : null;
  const a = isRecord(changes.after) ? changes.after : isRecord(changes.current) ? changes.current : isRecord(changes.new) ? changes.new : null;
  if (b || a) {
    const fields = new Set([...Object.keys(b ?? {}), ...Object.keys(a ?? {})]);
    return [...fields].map((f) => ({ field: f, before: b?.[f] ?? null, after: a?.[f] ?? null }));
  }
  return Object.entries(changes).map(([field, value]) => {
    if (isRecord(value)) {
      const before = value.before ?? value.previous ?? value.old ?? null;
      const after = value.after ?? value.current ?? value.new ?? null;
      if (before !== null || after !== null) return { field, before, after };
    }
    return { field, before: null, after: value };
  });
}

export function AuditClient({ companyId: _companyId, logs, members, policies, invoices }: Props) {
  const t = useT();
  const [search, setSearch] = useState('');

  const membersById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const membersByUserId = useMemo(
    () => new Map(members.filter((m) => m.userId).map((m) => [m.userId as string, m])),
    [members],
  );
  const policiesById = useMemo(() => new Map(policies.map((p) => [p.id, p])), [policies]);
  const invoicesById = useMemo(() => new Map(invoices.map((i) => [i.id, i])), [invoices]);

  function describeEntity(log: AuditEntry): string {
    if (!log.entityId) return log.entityType;
    const et = log.entityType.toLowerCase();
    if (['employee', 'member', 'user'].some((t) => et.includes(t))) {
      const m = membersById.get(log.entityId);
      return m ? (m.name?.trim() || m.email) : log.entityId.slice(0, 8);
    }
    if (et.includes('policy')) {
      return policiesById.get(log.entityId)?.name ?? log.entityId.slice(0, 8);
    }
    if (et.includes('invoice') || et.includes('billing')) {
      const inv = invoicesById.get(log.entityId);
      if (inv) {
        const month = new Date(inv.periodStart).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
        return `${month} · €${(inv.totalCents / 100).toFixed(2)}`;
      }
    }
    return log.entityId.slice(0, 8);
  }

  function describeActor(log: AuditEntry): string {
    if (!log.performedByUserId) return '—';
    const m = membersByUserId.get(log.performedByUserId);
    return m ? (m.name?.trim() || m.email) : log.performedByUserId.slice(0, 8);
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return logs;
    return logs.filter((l) =>
      l.action.toLowerCase().includes(q) ||
      l.entityType.toLowerCase().includes(q) ||
      (l.entityId ?? '').toLowerCase().includes(q),
    );
  }, [logs, search]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white">{t('nav_audit_log')}</h1>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter…"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-[#33d6c5] focus:outline-none sm:w-64"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="px-5 py-3 text-left">{t('audit_col_time')}</th>
                <th className="px-5 py-3 text-left">{t('audit_col_action')}</th>
                <th className="px-5 py-3 text-left">{t('audit_col_entity')}</th>
                <th className="px-5 py-3 text-left">{t('audit_col_by')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => {
                const diffRows = extractDiffRows(log.changes);
                return (
                  <tr key={log.id} className="border-b border-zinc-800/50 align-top hover:bg-zinc-800/20">
                    <td className="px-5 py-3 text-zinc-400 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td className="px-5 py-3">
                      <span className="font-medium text-white">{formatAction(log.action)}</span>
                      {diffRows.length > 0 && (
                        <dl className="mt-1.5 space-y-0.5">
                          {diffRows.map((row) => (
                            <div key={row.field} className="flex flex-wrap gap-1 text-xs text-zinc-500">
                              <dt className="shrink-0 text-zinc-400">{formatFieldName(row.field)}:</dt>
                              {row.before !== null && (
                                <dd className="line-through">{normalizeText(row.before)}</dd>
                              )}
                              {row.after !== null && (
                                <dd className="text-zinc-300">{normalizeText(row.after)}</dd>
                              )}
                            </div>
                          ))}
                        </dl>
                      )}
                    </td>
                    <td className="px-5 py-3 text-zinc-400">{describeEntity(log)}</td>
                    <td className="px-5 py-3 text-zinc-400">{describeActor(log)}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-zinc-500">
                    {t('audit_empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
