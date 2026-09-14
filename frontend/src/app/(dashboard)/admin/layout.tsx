import { redirect } from 'next/navigation';
import { verifyUserSession } from '@/lib/pocketbase-server';
import { AdminSubNav } from '@/components/admin/AdminSubNav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await verifyUserSession();

  if (!sessionUser || (sessionUser.role !== 'admin' && sessionUser.role !== 'meister')) {
    redirect('/craft');
  }

  return (
    <div className="flex flex-col min-h-full">
      <AdminSubNav />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

