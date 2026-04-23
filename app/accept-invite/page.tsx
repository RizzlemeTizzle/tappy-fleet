'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function AcceptInviteContent() {
  const params = useSearchParams();
  const router = useRouter();
  const inviteToken = params.get('token');
  const companyId = params.get('company');

  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        setAuthed(!!data);
        setLoggedInEmail(data?.email ?? null);
      })
      .catch(() => setAuthed(false));
  }, []);

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
    return (
      <p className="text-red-400 text-sm mt-4">
        Invalid invite link — token or company missing.
      </p>
    );
  }

  if (authed === null) return null;

  return (
    <>
      {state === 'idle' && (
        <>
          {!authed && (
            <p className="text-zinc-400 text-sm mb-4">
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
            <div className="flex items-center justify-between bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm mb-1">
              <span className="text-zinc-400">Signed in as <span className="text-white">{loggedInEmail}</span></span>
              <a
                href={`/api/auth/clear-cookie`}
                onClick={async (e) => { e.preventDefault(); await fetch('/api/auth/clear-cookie', { method: 'POST' }); router.push(`/auth/login?next=${encodeURIComponent('/accept-invite?token=' + inviteToken + '&company=' + companyId)}`); }}
                className="text-zinc-500 hover:text-zinc-300 text-xs ml-3 shrink-0"
              >
                Wrong account?
              </a>
            </div>
          )}
          <button
            onClick={handleAccept}
            disabled={!authed}
            className="w-full bg-gradient-to-r from-[#7c5cff] to-[#33d6c5] hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-opacity disabled:opacity-40 text-sm"
          >
            Accept invite
          </button>
        </>
      )}

      {state === 'loading' && (
        <p className="text-zinc-400 text-sm text-center">Accepting invite…</p>
      )}

      {state === 'success' && (
        <div className="text-center space-y-3">
          <div className="text-4xl">✅</div>
          <p className="text-white font-semibold">You've joined the fleet!</p>
          <p className="text-zinc-400 text-sm">
            Open the TapCharge app on your phone to start charging under your company account.
          </p>
        </div>
      )}

      {state === 'error' && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
          {message}
        </div>
      )}
    </>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#7c5cff] to-[#33d6c5] bg-clip-text text-transparent">⚡</div>
          <h1 className="text-2xl font-bold text-white">Fleet Invite</h1>
          <p className="text-zinc-400 mt-1 text-sm">You've been invited to join a company fleet</p>
        </div>
        <Suspense>
          <AcceptInviteContent />
        </Suspense>
      </div>
    </div>
  );
}
