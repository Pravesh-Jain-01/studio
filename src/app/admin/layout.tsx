
'use client';

import { useAuth, useUser } from '@/firebase';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Home, Shield, ExternalLink, LogOut, Shirt, ListOrdered, Warehouse } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

/**
 * AdminLayout provides a consistent sidebar and header for all pages within the admin section.
 * It also enforces an authentication check, redirecting non-admin users to the homepage.
 * @param {{ children: React.ReactNode }} props - The props for the component.
 * @param {React.ReactNode} props.children - The pages or components to be rendered within the layout.
 * @returns {JSX.Element} The protected admin layout structure.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Effect to protect admin routes.
  // It checks if the user is loaded, authenticated, and matches the admin email.
  useEffect(() => {
    if (!isUserLoading && (!user || user.email !== ADMIN_EMAIL)) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  // Display a loading state while verifying admin access.
  if (isUserLoading || !user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-secondary">
        <div className="text-center p-8">
          <p>Verifying admin access...</p>
        </div>
      </div>
    );
  }

  /**
   * Handles user logout by calling Firebase sign-out.
   */
  const handleLogout = () => {
    auth.signOut();
  };

  const navLinks = [
    { href: '/admin', label: 'Dashboard', icon: Home },
    { href: '/admin/products', label: 'Products', icon: Shirt },
    { href: '/admin/inventory', label: 'Inventory', icon: Warehouse },
    { href: '/admin/orders', label: 'Orders', icon: ListOrdered },
  ];

  return (
    <div className="flex min-h-screen bg-secondary/50">
      <aside className="w-64 bg-background p-4 flex-col border-r hidden md:flex">
        <h2 className="text-2xl font-bold font-headline mb-8 flex items-center gap-2 px-2">
          <Shield />
          Podium Wear Admin
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
            <p className="text-xs text-muted-foreground p-2">Logged in as {user.email}</p>
            <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
            </Button>
        </div>
      </aside>
      <div className="flex flex-col flex-1">
         <header className="bg-background border-b p-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold">Welcome back, Admin!</h1>
             <Button variant="outline" asChild>
                <Link href="/" target="_blank">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Site
                </Link>
            </Button>
        </header>
        <main className="flex-1 p-8 overflow-auto">
            {children}
        </main>
         <footer className="bg-background border-t p-4 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Podium Wear Admin Panel.
        </footer>
      </div>
    </div>
  );
}
