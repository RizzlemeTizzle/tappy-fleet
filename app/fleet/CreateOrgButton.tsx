'use client';

import { useState } from 'react';
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

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
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
        className="mt-6 bg-[#4CAF50] hover:bg-[#43A047] text-black font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
      >
        Create Organization
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Create Organization</h2>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white text-xl leading-none">&times;</button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Company Name *">
                <input value={form.name} onChange={set('name')} required
                  className={inputCls} placeholder="Acme EV Fleet" />
              </Field>
              <Field label="Legal Name *">
                <input value={form.legalName} onChange={set('legalName')} required
                  className={inputCls} placeholder="Acme Inc." />
              </Field>
              <Field label="Billing Email *">
                <input type="email" value={form.billingEmail} onChange={set('billingEmail')} required
                  className={inputCls} placeholder="billing@acme.com" />
              </Field>
              <Field label="VAT Number">
                <input value={form.vatNumber} onChange={set('vatNumber')}
                  className={inputCls} placeholder="NL123456789B01" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="City">
                  <input value={form.addressCity} onChange={set('addressCity')}
                    className={inputCls} placeholder="Amsterdam" />
                </Field>
                <Field label="Country">
                  <input value={form.addressCountry} onChange={set('addressCountry')}
                    className={inputCls} placeholder="NL" maxLength={2} />
                </Field>
              </div>
              <Field label="Address">
                <input value={form.addressLine1} onChange={set('addressLine1')}
                  className={inputCls} placeholder="Herengracht 1" />
              </Field>
              <Field label="Payment Mode">
                <select value={form.paymentMode} onChange={set('paymentMode')} className={inputCls}>
                  <option value="COMPANY_PAID">Company Paid</option>
                  <option value="EMPLOYEE_PAID_REIMBURSABLE">Employee Reimbursable</option>
                </select>
              </Field>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 py-2.5 rounded-lg text-sm transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-[#4CAF50] hover:bg-[#43A047] text-black font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60">
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

const inputCls = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#4CAF50] text-sm';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-zinc-400 block mb-1">{label}</label>
      {children}
    </div>
  );
}
