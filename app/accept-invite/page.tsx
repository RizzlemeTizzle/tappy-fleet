'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, LoaderCircle } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { BrandIcon } from '@/components/BrandIcon';
import TappyLogo from '@/components/TappyLogo';

function AcceptInviteContent() {
  const params = useSearchParams();
  const router = useRouter();
  const inviteToken = params.get('token');
  const companyId = params.get('company');

  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(null);
  const appUrl = 'https://tappy-charge.com/app';

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
      setMessage('Invalid invite link. Please ask your fleet manager to resend the invite.');
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
          ? `${body.error} Make sure you're signed in with the account the invite was sent to.`
          : (body.error ?? 'Failed to accept invite. It may have expired.');
        setMessage(hint);
        return;
      }
      setState('success');
    } catch {
      setState('error');
      setMessage('Network error. Please try again.');
    }
  }

  if (!inviteToken || !companyId) {
    return <p className="mt-4 text-sm text-red-400">Invalid invite link: token or company missing.</p>;
  }

  if (authed === null) return null;

  return (
    <>
      {state === 'idle' && (
        <>
          {!authed && (
            <p className="mb-4 text-sm text-zinc-400">
              You need a Tappy Charge account to accept this invite.{' '}
              <a
                href={`/auth/login?next=${encodeURIComponent('/accept-invite?token=' + inviteToken + '&company=' + companyId)}`}
                className="text-[#7c5cff] hover:underline"
              >
                Sign in
              </a>{' '}
              or{' '}
              <a
                href={`/auth/register?next=${encodeURIComponent('/accept-invite?token=' + inviteToken + '&company=' + companyId)}`}
                className="text-[#7c5cff] hover:underline"
              >
                create an account
              </a>{' '}
              first.
            </p>
          )}
          {authed && loggedInEmail && (
            <div className="mb-1 flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-4 py-2.5 text-sm">
              <span className="text-zinc-400">
                Signed in as <span className="text-white">{loggedInEmail}</span>
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
                Wrong account?
              </a>
            </div>
          )}
          <button
            onClick={handleAccept}
            disabled={!authed}
            className="w-full rounded-xl bg-gradient-to-r from-[#7c5cff] to-[#33d6c5] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Accept invite
          </button>
        </>
      )}

      {state === 'loading' && (
        <div className="flex items-center justify-center gap-2 text-center text-sm text-zinc-400">
          <LoaderCircle size={16} className="animate-spin" />
          <span>Accepting invite...</span>
        </div>
      )}

      {state === 'success' && (
        <div className="space-y-3 text-center">
          <div className="flex justify-center">
            <BrandIcon icon={CheckCircle2} tone="teal" className="h-16 w-16" size={28} />
          </div>
          <p className="font-semibold text-white">You've joined the fleet!</p>
          <p className="text-sm text-zinc-400">
            Redirecting you to the Tappy Charge app page so you can continue on your phone.
          </p>
          <a
            href={appUrl}
            className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#7c5cff] to-[#33d6c5] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Open app page
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
          <h1 className="text-2xl font-bold text-white">Fleet Invite</h1>
          <p className="mt-1 text-sm text-zinc-400">You've been invited to join a company fleet</p>
        </div>
        <Suspense>
          <AcceptInviteContent />
        </Suspense>
      </div>
    </div>
  );
}
