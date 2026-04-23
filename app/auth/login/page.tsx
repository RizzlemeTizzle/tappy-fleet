'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
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
        setError(body.error ?? 'Invalid email or password');
        return;
      }
      router.push('/fleet');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="text-4xl font-bold text-[#4CAF50] mb-2">⚡</div>
          <h1 className="text-2xl font-bold text-white">TapCharge Fleet</h1>
          <p className="text-zinc-400 mt-1 text-sm">Sign in to manage your fleet</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label className="text-sm text-zinc-400 block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#4CAF50] text-sm"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="text-sm text-zinc-400 block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#4CAF50] text-sm"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4CAF50] hover:bg-[#43A047] text-black font-semibold py-3 rounded-lg transition-colors disabled:opacity-60 text-sm"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="text-center text-zinc-500 text-sm">
          No account?{' '}
          <Link href="/auth/register" className="text-[#4CAF50] hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
