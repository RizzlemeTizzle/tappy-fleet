'use client';

import { useT } from '@/lib/i18n';

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  performedByUserId: string;
  createdAt: string;
  changes: Record<string, unknown> | null;
}

interface Props {
  logs: AuditEntry[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function AuditClient({ logs }: Props) {
  const t = useT();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">{t('nav_audit_log')}</h1>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="text-left px-5 py-3">{t('audit_col_time')}</th>
              <th className="text-left px-5 py-3">{t('audit_col_action')}</th>
              <th className="text-left px-5 py-3">{t('audit_col_entity')}</th>
              <th className="text-left px-5 py-3">{t('audit_col_by')}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="px-5 py-3 text-zinc-400 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                <td className="px-5 py-3">
                  <span className="text-white font-medium">{log.action}</span>
                </td>
                <td className="px-5 py-3 text-zinc-400">
                  {log.entityType}{log.entityId ? ` · ${log.entityId.slice(0, 8)}` : ''}
                </td>
                <td className="px-5 py-3 text-zinc-400 font-mono text-xs">{log.performedByUserId.slice(0, 8)}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-zinc-500">{t('audit_empty')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
