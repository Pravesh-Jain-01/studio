'use client';

import { useUser } from '@/firebase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Home, Shield } from 'lucide-react';

// In a real-world scenario, admin access would be controlled by Firebase Custom Claims,
// which are set on a secure server. For this prototype, we'll simulate this by
// checking against an email address stored in an environment variable.
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && (!user || user.email !== ADMIN_EMAIL)) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="container py-12 text-center">
        <p>Loading and verifying admin access...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-secondary p-4 flex flex-col">
        <h2 className="text-2xl font-bold font-headline mb-8 flex items-center gap-2">
          <Shield />
          Admin Panel
        </h2>
        <nav className="flex flex-col space-y-2">
          <Link href="/admin" className="flex items-center gap-2 p-2 rounded-md hover:bg-primary/10">
            <Home className="h-5 w-5" />
            Dashboard
          </Link>
          {/* Admin navigation links will go here */}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
