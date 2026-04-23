'use client';

import { useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CreateOrgButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    legalName: '',
    billingEmail: '',
    vatNumber: '',
    addressLine1: '',
    addressCity: '',
    addressCountry: '',
    paymentMode: 'COMPANY_PAID' as 'COMPANY_PAID' | 'EMPLOYEE_PAID_REIMBURSABLE',
  });

  const set =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/fleet/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? 'Failed to create organization');
        return;
      }
      router.push(`/fleet/${body.company.id}`);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#33d6c5] px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-[#5fe2d4]"
      >
        <Plus size={16} strokeWidth={2.3} />
        Create Organization
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#33d6c5]/20 bg-[#33d6c5]/10 text-[#7ce9de]">
                  <Building2 size={18} strokeWidth={2.1} />
                </span>
                <h2 className="text-lg font-bold text-white">Create Organization</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-xl leading-none text-zinc-500 hover:text-white"
              >
                &times;
              </button>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Company Name *">
                <input value={form.name} onChange={set('name')} required className={inputCls} placeholder="Acme EV Fleet" />
              </Field>
              <Field label="Legal Name *">
                <input value={form.legalName} onChange={set('legalName')} required className={inputCls} placeholder="Acme Inc." />
              </Field>
              <Field label="Billing Email *">
                <input type="email" value={form.billingEmail} onChange={set('billingEmail')} required className={inputCls} placeholder="billing@acme.com" />
              </Field>
              <Field label="VAT Number">
                <input value={form.vatNumber} onChange={set('vatNumber')} className={inputCls} placeholder="NL123456789B01" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="City">
                  <input value={form.addressCity} onChange={set('addressCity')} className={inputCls} placeholder="Amsterdam" />
                </Field>
                <Field label="Country">
                  <input value={form.addressCountry} onChange={set('addressCountry')} className={inputCls} placeholder="Netherlands" />
                </Field>
              </div>
              <Field label="Address">
                <input value={form.addressLine1} onChange={set('addressLine1')} className={inputCls} placeholder="Herengracht 1" />
              </Field>
              <Field label="Payment Mode">
                <select value={form.paymentMode} onChange={set('paymentMode')} className={inputCls}>
                  <option value="COMPANY_PAID">Company Paid</option>
                  <option value="EMPLOYEE_PAID_REIMBURSABLE">Employee Reimbursable</option>
                </select>
              </Field>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-zinc-700 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-[#33d6c5] py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#5fe2d4] disabled:opacity-60"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const inputCls =
  'w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-[#33d6c5] focus:outline-none';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-zinc-400">{label}</label>
      {children}
    </div>
  );
}
