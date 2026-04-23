import { cookies } from 'next/headers';
import { API_URL } from './api';

export async function apiFetch(path: string, init?: RequestInit) {
  const cookieStore = await cookies();
  const token = cookieStore.get('tappy_token')?.value;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${API_URL}/api${path}`, { ...init, headers, cache: 'no-store' });
}
