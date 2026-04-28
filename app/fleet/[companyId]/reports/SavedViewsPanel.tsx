'use client';

import { Save, Trash2 } from 'lucide-react';
import { FleetCard } from '@/components/fleet/FleetDashboard';
import { fleetButtonClass } from '@/lib/fleet-ui';
import { describeFilters } from './reportUtils';
import type { Member, Policy, SavedView } from './types';

export function SavedViewsPanel({
  savedViews,
  viewName,
  members,
  policies,
  onViewNameChange,
  onSave,
  onApply,
  onDelete,
}: {
  savedViews: SavedView[];
  viewName: string;
  members: Member[];
  policies: Policy[];
  onViewNameChange: (value: string) => void;
  onSave: () => void;
  onApply: (view: SavedView) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <FleetCard className="p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2 text-white">
        <Save size={16} />
        <h2 className="font-semibold">Saved views</h2>
      </div>
      <p className="mb-4 text-sm text-zinc-400">
        Store common filter combinations in this browser for faster reporting.
      </p>
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-xs text-zinc-400">View name</span>
          <input
            value={viewName}
            onChange={(event) => onViewNameChange(event.target.value)}
            placeholder="Month-end finance pack"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#33d6c5]"
          />
        </label>
        <button type="button" onClick={onSave} className={fleetButtonClass('secondary', 'md', 'w-full')}>
          <Save size={16} strokeWidth={2.1} />
          Save current view
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {savedViews.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-700 px-3 py-4 text-sm text-zinc-500">
            No saved views yet.
          </div>
        )}
        {savedViews.map((view) => (
          <div key={view.id} className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium text-white">{view.name}</div>
                <div className="mt-1 text-xs text-zinc-500">{describeFilters(view.filters, members, policies)}</div>
              </div>
              <button
                type="button"
                onClick={() => onDelete(view.id)}
                className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
                aria-label={`Delete saved view ${view.name}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
            <button type="button" onClick={() => onApply(view)} className={fleetButtonClass('subtle', 'sm', 'mt-3 w-full')}>
              Apply view
            </button>
          </div>
        ))}
      </div>
    </FleetCard>
  );
}
