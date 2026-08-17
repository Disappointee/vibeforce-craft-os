import { redirect } from 'next/navigation';
import { verifyUserSession } from '@/lib/pocketbase-server';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await verifyUserSession();

  if (!sessionUser || sessionUser.role !== 'admin') {
    redirect('/tasks');
  }

  return <>{children}</>;
}
