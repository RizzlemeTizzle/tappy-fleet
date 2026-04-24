'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, LoaderCircle } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { BrandIcon } from '@/components/BrandIcon';
import TappyLogo from '@/components/TappyLogo';
import { fleetButtonClass } from '@/lib/fleet-ui';
import { useT } from '@/lib/i18n';

function AcceptInviteContent() {
  const t = useT();
  const params = useSearchParams();
  const router = useRouter();
  const inviteToken = params.get('token');
  const companyId = params.get('company');

  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(null);
  const appUrl = 'https://www.tappy-charge.com/app.html';

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setAuthed(!!data);
        setLoggedInEmail(data?.email ?? null);
      })
      .catch(() => setAuthed(false));
  }, []);

  useEffect(() => {
    if (state !== 'success') return;

    const timeout = window.setTimeout(() => {
      window.location.href = appUrl;
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [state]);

  async function handleAccept() {
    if (!inviteToken || !companyId) {
      setState('error');
      setMessage(t('invite_invalid_link'));
      return;
    }
    setState('loading');
    try {
      const res = await fetch('/api/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteToken, companyId }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        router.push(`/auth/login?next=${returnUrl}`);
        return;
      }
      if (!res.ok) {
        setState('error');
        const hint = body.error?.toLowerCase().includes('invalid')
          ? `${body.error} ${t('invite_wrong_account_hint')}`
          : (body.error ?? t('invite_failed_expired'));
        setMessage(hint);
        return;
      }
      setState('success');
    } catch {
      setState('error');
      setMessage(t('network_error'));
    }
  }

  if (!inviteToken || !companyId) {
    return <p className="mt-4 text-sm text-red-400">{t('invite_missing_params')}</p>;
  }

  if (authed === null) return null;

  return (
    <>
      {state === 'idle' && (
        <>
          {!authed && (
            <p className="mb-4 text-sm text-zinc-400">
              {t('invite_need_account')}{' '}
              <a
                href={`/auth/login?next=${encodeURIComponent('/accept-invite?token=' + inviteToken + '&company=' + companyId)}`}
                className="text-[#7c5cff] hover:underline"
              >
                {t('invite_sign_in')}
              </a>{' '}
              {t('invite_or')}{' '}
              <a
                href={`/auth/register?next=${encodeURIComponent('/accept-invite?token=' + inviteToken + '&company=' + companyId)}`}
                className="text-[#7c5cff] hover:underline"
              >
                {t('invite_create_account')}
              </a>{' '}
              {t('invite_first')}
            </p>
          )}
          {authed && loggedInEmail && (
            <div className="mb-1 flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-4 py-2.5 text-sm">
              <span className="text-zinc-400">
                {t('invite_signed_in_as')} <span className="text-white">{loggedInEmail}</span>
              </span>
              <a
                href={`/api/auth/clear-cookie`}
                onClick={async (e) => {
                  e.preventDefault();
                  await fetch('/api/auth/clear-cookie', { method: 'POST' });
                  router.push(
                    `/auth/login?next=${encodeURIComponent('/accept-invite?token=' + inviteToken + '&company=' + companyId)}`,
                  );
                }}
                className="ml-3 shrink-0 text-xs text-zinc-500 hover:text-zinc-300"
              >
                {t('invite_wrong_account')}
              </a>
            </div>
          )}
          <button
            onClick={handleAccept}
            disabled={!authed}
            className={fleetButtonClass('primary', 'lg', 'w-full disabled:opacity-40')}
          >
            {t('invite_accept_btn')}
          </button>
        </>
      )}

      {state === 'loading' && (
        <div className="flex items-center justify-center gap-2 text-center text-sm text-zinc-400">
          <LoaderCircle size={16} className="animate-spin" />
          <span>{t('invite_accepting')}</span>
        </div>
      )}

      {state === 'success' && (
        <div className="space-y-3 text-center">
          <div className="flex justify-center">
            <BrandIcon icon={CheckCircle2} tone="teal" className="h-16 w-16" size={28} />
          </div>
          <p className="font-semibold text-white">{t('invite_success_title')}</p>
          <p className="text-sm text-zinc-400">{t('invite_success_desc')}</p>
          <a
            href={appUrl}
            className={fleetButtonClass('primary', 'lg', 'w-full')}
          >
            {t('invite_open_app')}
          </a>
        </div>
      )}

      {state === 'error' && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {message}
        </div>
      )}
    </>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mb-3 flex justify-center">
            <TappyLogo size={56} />
          </div>
          <Suspense fallback={null}>
            <AcceptInvitePageHeader />
          </Suspense>
        </div>
        <Suspense>
          <AcceptInviteContent />
        </Suspense>
      </div>
    </div>
  );
}

function AcceptInvitePageHeader() {
  const t = useT();
  return (
    <>
      <h1 className="text-2xl font-bold text-white">{t('invite_page_title')}</h1>
      <p className="mt-1 text-sm text-zinc-400">{t('invite_page_subtitle')}</p>
    </>
  );
}
