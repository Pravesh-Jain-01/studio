'use client';

import { useAuth, useUser } from '@/firebase';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Home, Shield, ExternalLink, LogOut, Shirt, ListOrdered } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isUserLoading && (!user || user.email !== ADMIN_EMAIL)) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-secondary">
        <div className="text-center p-8">
          <p>verifying admin access...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    auth.signOut();
  };

  const navLinks = [
    { href: '/admin', label: 'dashboard', icon: Home },
    { href: '/admin/products', label: 'products', icon: Shirt },
  ];

  return (
    <div className="flex min-h-screen bg-secondary/50">
      <aside className="w-64 bg-background p-4 flex-col border-r hidden md:flex">
        <h2 className="text-2xl font-bold font-headline mb-8 flex items-center gap-2 px-2">
          <Shield />
          softsaath admin
        </h2>
        <nav className="flex flex-col space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 p-2 rounded-md font-medium capitalize',
                pathname === link.href
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              <link.icon className="h-5 w-5" />
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2">
            <p className="text-xs text-muted-foreground p-2">logged in as {user.email}</p>
            <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                log out
            </Button>
        </div>
      </aside>
      <div className="flex flex-col flex-1">
         <header className="bg-background border-b p-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold">welcome back, admin!</h1>
             <Button variant="outline" asChild>
                <Link href="/" target="_blank">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    view site
                </Link>
            </Button>
        </header>
        <main className="flex-1 p-8 overflow-auto">
            {children}
        </main>
         <footer className="bg-background border-t p-4 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} softsaath admin panel.
        </footer>
      </div>
    </div>
  );
}
