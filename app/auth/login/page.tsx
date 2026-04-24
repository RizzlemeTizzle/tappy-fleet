'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import TappyLogo from '@/components/TappyLogo';
import { useT } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { fleetButtonClass } from '@/lib/fleet-ui';

function LoginForm() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/fleet';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/set-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? t('login_invalid'));
        return;
      }
      router.push(next);
    } catch {
      setError(t('network_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <TappyLogo size={56} />
          </div>
          <h1 className="text-2xl font-bold text-white">{t('login_title')}</h1>
          <p className="text-zinc-400 mt-1 text-sm">{t('login_subtitle')}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label className="text-sm text-zinc-400 block mb-1.5">{t('label_email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#7c5cff] text-sm"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="text-sm text-zinc-400 block mb-1.5">{t('label_password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#7c5cff] text-sm"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={fleetButtonClass('primary', 'lg', 'w-full')}
          >
            {loading ? t('login_signing_in') : t('login_cta')}
          </button>
        </form>
        <p className="text-center text-zinc-500 text-sm">
          {t('login_no_account')}{' '}
          <Link
            href={`/auth/register?next=${encodeURIComponent(next)}`}
            className="text-[#7c5cff] hover:underline"
          >
            {t('login_register_link')}
          </Link>
        </p>
        <div className="flex justify-center">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
