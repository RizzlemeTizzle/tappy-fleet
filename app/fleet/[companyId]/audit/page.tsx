import { apiFetch } from '@/lib/apiFetch';

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  performedByUserId: string;
  createdAt: string;
  changes: Record<string, unknown> | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default async function AuditPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const res = await apiFetch(`/fleet/companies/${companyId}/audit-log`);
  const logs: AuditEntry[] = res.ok ? await res.json() : [];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Audit Log</h1>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="text-left px-5 py-3">Time</th>
              <th className="text-left px-5 py-3">Action</th>
              <th className="text-left px-5 py-3">Entity</th>
              <th className="text-left px-5 py-3">By</th>
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
                <td colSpan={4} className="px-5 py-10 text-center text-zinc-500">No audit events yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
