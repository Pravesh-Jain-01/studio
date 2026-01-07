'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { ShoppingBag, LogOut } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';

export function SiteHeader() {
  const navLinks = [
    { href: '/shop', label: 'shop' },
    { href: '/collections/bas-ehsaas', label: 'collections' },
    { href: '/about', label: 'about' },
    { href: '/contact', label: 'contact' },
  ];

  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-6 flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl tracking-tighter font-headline">
              softsaath
            </span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
          {isUserLoading ? (
            <div className="h-8 w-24 bg-muted rounded-md animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden md:inline-block">
                {user.email}
              </span>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Log Out</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">register</Link>
              </Button>
            </div>
          )}

          <Button variant="ghost" size="icon">
            <ShoppingBag className="h-5 w-5" />
            <span className="sr-only">Shopping Bag</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
