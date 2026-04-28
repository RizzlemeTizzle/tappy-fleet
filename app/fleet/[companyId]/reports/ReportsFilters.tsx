'use client';

import { Filter } from 'lucide-react';
import { FleetCard } from '@/components/fleet/FleetDashboard';
import { fleetButtonClass } from '@/lib/fleet-ui';
import DatePicker from './DatePicker';
import { FilterSelect } from './FilterSelect';
import { BILLING_MODE_OPTIONS, type Member, type Policy, type ReportFilters } from './types';

export function ReportsFilters({
  filters,
  employees,
  departments,
  policies,
  totalLabel,
  feedback,
  tr,
  onChange,
  onApply,
  onReset,
}: {
  filters: ReportFilters;
  employees: Member[];
  departments: string[];
  policies: Policy[];
  totalLabel: string;
  feedback: string;
  tr: (key: string, fallback: string) => string;
  onChange: (filters: ReportFilters) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  const updateFilter = (patch: Partial<ReportFilters>) => onChange({ ...filters, ...patch });

  return (
    <FleetCard as="div" className="p-4 sm:p-5">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onApply();
        }}
        className="contents"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DatePicker label={tr('label_from', 'From')} value={filters.from} onChange={(from) => updateFilter({ from })} />
          <DatePicker label={tr('label_to', 'To')} value={filters.to} onChange={(to) => updateFilter({ to })} />
          <FilterSelect
            label="Employee"
            value={filters.employeeId}
            onChange={(employeeId) => updateFilter({ employeeId })}
            options={[
              { value: '', label: 'All employees' },
              ...employees.map((member) => ({
                value: member.id,
                label: member.user_name ?? member.user_email,
              })),
            ]}
          />
          <FilterSelect
            label="Department"
            value={filters.department}
            onChange={(department) => updateFilter({ department })}
            options={[
              { value: '', label: 'All departments' },
              ...departments.map((name) => ({ value: name, label: name })),
            ]}
          />
          <FilterSelect
            label="Billing mode"
            value={filters.billingMode}
            onChange={(billingMode) => updateFilter({ billingMode })}
            options={BILLING_MODE_OPTIONS}
          />
          <FilterSelect
            label="Policy"
            value={filters.policyId}
            onChange={(policyId) => updateFilter({ policyId })}
            options={[
              { value: '', label: 'All policies' },
              ...policies.map((policy) => ({ value: policy.id, label: policy.name })),
            ]}
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button type="submit" className={fleetButtonClass('secondary', 'md', 'w-full sm:w-auto')}>
            <Filter size={16} strokeWidth={2.2} />
            {tr('btn_apply', 'Apply')}
          </button>
          <button type="button" onClick={onReset} className={fleetButtonClass('subtle', 'md', 'w-full sm:w-auto')}>
            Reset
          </button>
          <div className="text-sm text-zinc-400">{totalLabel}</div>
        </div>

        {feedback && (
          <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {feedback}
          </div>
        )}
      </form>
    </FleetCard>
  );
}
