'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CreateOrgButton from './CreateOrgButton';
import { fleetButtonClass } from '@/lib/fleet-ui';
import { useT } from '@/lib/i18n';

export interface OrganizationSummary {
  id: string;
  companyId: string;
  companyName: string;
  role: string;
  status: string;
  legalName: string;
  billingEmail: string;
  vatNumber: string;
  addressLine1: string;
  addressCity: string;
  addressCountry: string;
  paymentMode: 'COMPANY_PAID' | 'EMPLOYEE_PAID_REIMBURSABLE';
  canEdit: boolean;
  canDelete: boolean;
}

interface Props {
  organizations: OrganizationSummary[];
  totalMemberships: number;
}

const ROLE_COLORS: Record<string, string> = {
  FLEET_OWNER: 'bg-green-500/20 text-green-300 ring-1 ring-green-500/20',
  FLEET_ADMIN: 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/20',
  FINANCE_ADMIN: 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/20',
  TEAM_MANAGER: 'bg-fuchsia-500/20 text-fuchsia-300 ring-1 ring-fuchsia-500/20',
  EMPLOYEE: 'bg-white/10 text-zinc-300 ring-1 ring-white/10',
};

const inputCls =
  'w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-[#33d6c5] focus:outline-none';

function buildForm(org: OrganizationSummary) {
  return {
    name: org.companyName,
    legalName: org.legalName,
    billingEmail: org.billingEmail,
    vatNumber: org.vatNumber,
    addressLine1: org.addressLine1,
    addressCity: org.addressCity,
    addressCountry: org.addressCountry,
  };
}

export default function OrganizationHub({ organizations, totalMemberships }: Props) {
  const t = useT();
  const router = useRouter();
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    legalName: '',
    billingEmail: '',
    vatNumber: '',
    addressLine1: '',
    addressCity: '',
    addressCountry: '',
  });

  const editingOrg = useMemo(
    () => organizations.find((org) => org.companyId === editingCompanyId) ?? null,
    [editingCompanyId, organizations],
  );

  const openEditor = (org: OrganizationSummary) => {
    setError('');
    setEditingCompanyId(org.companyId);
    setForm(buildForm(org));
  };

  const closeEditor = () => {
    if (saving) return;
    setEditingCompanyId(null);
    setError('');
  };

  const setField =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((current) => ({ ...current, [field]: e.target.value }));
    };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editingOrg) return;

    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/fleet/companies/${editingOrg.companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(body.error ?? t('org_save_error'));
        return;
      }

      setEditingCompanyId(null);
      router.refresh();
    } catch {
      setError(t('network_error'));
    } finally {
      setSaving(false);
    }
  }

  if (organizations.length === 0) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 text-center shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
        <p className="text-lg font-semibold text-white">{t('hub_no_orgs_title')}</p>
        <p className="mt-2 text-sm text-zinc-400">
          {totalMemberships > 0 ? t('hub_no_orgs_member') : t('hub_no_orgs_empty')}
        </p>
        {totalMemberships === 0 && (
          <div className="mt-6 flex justify-center">
            <CreateOrgButton className="mt-6" />
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(11,15,23,0.9)_45%,rgba(51,214,197,0.08))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.4)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#33d6c5]">
              {t('hub_eyebrow')}
            </p>
            <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
              {t('hub_title')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-300 sm:text-base">
              {t('hub_subtitle')}
            </p>
          </div>
          <div className="flex flex-wrap items-stretch gap-3">
            <div className="inline-flex h-11 items-center rounded-full border border-white/10 bg-black/20 px-4 text-sm text-zinc-300">
              {organizations.length}{' '}
              {organizations.length === 1 ? t('active_org_singular') : t('active_org_plural')}
            </div>
            <CreateOrgButton />
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {organizations.map((org) => (
          <article
            key={org.id}
            className="rounded-[26px] border border-white/10 bg-white/[0.05] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">{org.companyName}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${ROLE_COLORS[org.role] ?? ROLE_COLORS.EMPLOYEE}`}
                  >
                    {org.role.replace(/_/g, ' ')}
                  </span>
                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-medium text-zinc-300">
                    {org.status.toLowerCase()}
                  </span>
                </div>
              </div>
            </div>

            <dl className="mt-6 space-y-3 text-sm">
              <MetaRow label={t('field_legal_name')} value={org.legalName || t('not_set')} />
              <MetaRow label={t('field_billing_email')} value={org.billingEmail || t('not_set')} />
              <MetaRow label={t('field_vat')} value={org.vatNumber || t('not_set')} />
              <MetaRow
                label={t('field_address')}
                value={
                  [org.addressLine1, org.addressCity, org.addressCountry]
                    .filter(Boolean)
                    .join(', ') || t('not_set')
                }
              />
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/fleet/${org.companyId}`}
                className={fleetButtonClass('primary')}
              >
                {t('hub_open_fleet')}
              </Link>
              {org.canEdit && (
                <button
                  type="button"
                  onClick={() => openEditor(org)}
                  className={fleetButtonClass('secondary')}
                >
                  {t('hub_manage_details')}
                </button>
              )}
            </div>
            {org.role === 'FLEET_OWNER' && (
              <p className="mt-4 text-sm text-zinc-400">
                Organization removal is handled by support. Contact the Tappy team if this workspace needs to be deleted.
              </p>
            )}
          </article>
        ))}
      </div>

      {editingOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-[28px] border border-white/10 bg-[#0b0f17] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">{t('hub_manage_modal_title')}</h2>
                <p className="mt-1 text-sm text-zinc-400">{editingOrg.companyName}</p>
              </div>
                <button
                  type="button"
                  onClick={closeEditor}
                  className={fleetButtonClass('subtle', 'sm', 'min-h-0 rounded-lg px-3 py-2 text-zinc-400')}
                >
                  {t('btn_close')}
                </button>
            </div>

            {error && (
              <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="mt-6 space-y-4">
              <Field label={`${t('field_company_name')} *`}>
                <input value={form.name} onChange={setField('name')} required className={inputCls} placeholder="Acme EV Fleet" />
              </Field>
              <Field label={`${t('field_legal_name')} *`}>
                <input value={form.legalName} onChange={setField('legalName')} required className={inputCls} placeholder="Acme B.V." />
              </Field>
              <Field label={`${t('field_billing_email')} *`}>
                <input type="email" value={form.billingEmail} onChange={setField('billingEmail')} required className={inputCls} placeholder="billing@acme.com" />
              </Field>
              <Field label={t('field_vat')}>
                <input value={form.vatNumber} onChange={setField('vatNumber')} className={inputCls} placeholder="NL123456789B01" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('field_city')}>
                  <input value={form.addressCity} onChange={setField('addressCity')} className={inputCls} placeholder="Amsterdam" />
                </Field>
                <Field label={t('field_country')}>
                  <input value={form.addressCountry} onChange={setField('addressCountry')} className={inputCls} placeholder="Netherlands" />
                </Field>
              </div>
              <Field label={t('field_address')}>
                <input value={form.addressLine1} onChange={setField('addressLine1')} className={inputCls} placeholder="Herengracht 1" />
              </Field>
              <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditor}
                  className={fleetButtonClass('secondary')}
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={fleetButtonClass('primary')}
                >
                  {saving ? t('btn_saving') : t('btn_save_changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </label>
      {children}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="max-w-[65%] text-right text-zinc-200">{value}</dd>
    </div>
  );
}
