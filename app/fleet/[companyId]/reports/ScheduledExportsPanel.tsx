'use client';

import { CalendarClock, Trash2 } from 'lucide-react';
import { FleetCard } from '@/components/fleet/FleetDashboard';
import { fleetButtonClass } from '@/lib/fleet-ui';
import { describeFilters, getNextRun, getPreviousClosedPeriod, scheduleDescription } from './reportUtils';
import { FilterSelect } from './FilterSelect';
import type { ExportSchedule, Member, Policy, ReportFilters, SavedView } from './types';

export function ScheduledExportsPanel({
  schedules,
  scheduleName,
  scheduleEmail,
  scheduleFrequency,
  members,
  policies,
  onScheduleNameChange,
  onScheduleEmailChange,
  onScheduleFrequencyChange,
  onSave,
  onDelete,
  onApply,
  onExport,
}: {
  schedules: ExportSchedule[];
  scheduleName: string;
  scheduleEmail: string;
  scheduleFrequency: ExportSchedule['frequency'];
  members: Member[];
  policies: Policy[];
  onScheduleNameChange: (value: string) => void;
  onScheduleEmailChange: (value: string) => void;
  onScheduleFrequencyChange: (value: ExportSchedule['frequency']) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  onApply: (view: SavedView) => void;
  onExport: (filters: ReportFilters, fileStem: string) => void;
}) {
  return (
    <FleetCard className="p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2 text-white">
        <CalendarClock size={16} />
        <h2 className="font-semibold">Scheduled exports</h2>
      </div>
      <p className="mb-4 text-sm text-zinc-400">
        Save a reusable email export preset in this browser. Weekly sends always use the previous full Monday-Sunday week, and monthly sends use the previous full calendar month.
      </p>
      <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-3 text-sm text-amber-100">
        Automatic background emailing is not wired up in this frontend yet, so these presets stay on this device for now.
      </div>
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-xs text-zinc-400">Schedule name</span>
          <input
            value={scheduleName}
            onChange={(event) => onScheduleNameChange(event.target.value)}
            placeholder="Weekly finance export"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#33d6c5]"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-zinc-400">Email address</span>
          <input
            type="email"
            value={scheduleEmail}
            onChange={(event) => onScheduleEmailChange(event.target.value)}
            placeholder="finance@company.com"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#33d6c5]"
          />
        </label>
        <FilterSelect
          label="Frequency"
          value={scheduleFrequency}
          onChange={(value) => onScheduleFrequencyChange(value as ExportSchedule['frequency'])}
          options={[
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
          ]}
        />
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-3 text-sm text-zinc-400">
          {scheduleFrequency === 'weekly'
            ? 'Weekly exports are prepared every Monday at 09:00 and include the full week that just closed.'
            : 'Monthly exports are prepared on the 1st at 09:00 and include the full previous calendar month.'}
        </div>
        <button type="button" onClick={onSave} className={fleetButtonClass('secondary', 'md', 'w-full')}>
          <CalendarClock size={16} strokeWidth={2.1} />
          Save schedule
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {schedules.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-700 px-3 py-4 text-sm text-zinc-500">
            No schedules saved yet.
          </div>
        )}
        {schedules.map((schedule) => (
          <div key={schedule.id} className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium text-white">{schedule.name}</div>
                <div className="mt-1 text-xs text-zinc-500">{scheduleDescription(schedule)}</div>
                <div className="mt-1 text-xs text-zinc-500">
                  Next run {getNextRun(schedule).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
                <div className="mt-1 text-xs text-zinc-500">Recipient {schedule.recipientEmail}</div>
                <div className="mt-1 text-xs text-zinc-500">Data window {getPreviousClosedPeriod(schedule.frequency).label}</div>
                <div className="mt-2 text-xs text-zinc-500">{describeFilters(schedule.filters, members, policies)}</div>
              </div>
              <button
                type="button"
                onClick={() => onDelete(schedule.id)}
                className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
                aria-label={`Delete scheduled export ${schedule.name}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => onApply({ id: schedule.id, name: schedule.name, filters: schedule.filters, createdAt: schedule.createdAt })}
                className={fleetButtonClass('subtle', 'sm', 'w-full')}
              >
                Load filters
              </button>
              <button
                type="button"
                onClick={() => {
                  const period = getPreviousClosedPeriod(schedule.frequency);
                  onExport(
                    {
                      ...schedule.filters,
                      from: period.from,
                      to: period.to,
                    },
                    schedule.name.toLowerCase().replace(/\s+/g, '-'),
                  );
                }}
                className={fleetButtonClass('secondary', 'sm', 'w-full')}
              >
                Run export now
              </button>
            </div>
          </div>
        ))}
      </div>
    </FleetCard>
  );
}
