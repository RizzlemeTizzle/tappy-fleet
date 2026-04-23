import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('tappy_token')?.value ?? null;
  return { token };
}

export async function requireAuth() {
  const { token } = await getSession();
  if (!token) redirect('/auth/login');
  return { token };
}
