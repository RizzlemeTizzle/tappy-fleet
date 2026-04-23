import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function RootPage() {
  const { token } = await getSession();
  if (token) redirect('/fleet');
  redirect('/auth/login');
}
