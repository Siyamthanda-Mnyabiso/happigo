import { Sidebar } from '@/components/admin/sidebar';
import { getAdmin } from '@/lib/admin';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getAdmin(); // sends anyone who is not staff to the admin sign in
  return (
    <div className="min-h-dvh bg-page md:flex">
      <Sidebar email={user.email ?? ''} />
      <main className="min-w-0 flex-1 px-6 py-8 md:px-12 md:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
