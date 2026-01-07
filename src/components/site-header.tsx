'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { ShoppingBag, LogOut, User as UserIcon, ListOrdered, Shield } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { useCart } from '@/context/cart-context';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export function SiteHeader() {
  const navLinks = [
    { href: '/shop', label: 'shop' },
    { href: '/collections/bas-ehsaas', label: 'collections' },
    { href: '/about', label: 'about' },
    { href: '/contact', label: 'contact' },
  ];

  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { cart } = useCart();

  const handleLogout = () => {
    auth.signOut();
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const isAdmin = user?.email === ADMIN_EMAIL;

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
        <div className="flex flex-1 items-center justify-end space-x-2">
          {isUserLoading ? (
            <div className="h-8 w-24 bg-muted rounded-md animate-pulse" />
          ) : user ? (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <UserIcon className="h-5 w-5" />
                  <span className="sr-only">User Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>my account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                   <DropdownMenuItem asChild>
                    <Link href="/admin"><Shield className="mr-2 h-4 w-4" />admin</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/profile"><UserIcon className="mr-2 h-4 w-4" />profile</Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                  <Link href="/orders"><ListOrdered className="mr-2 h-4 w-4" />my orders</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

          <Button asChild variant="ghost" size="icon" className="relative">
             <Link href="/cart">
                <ShoppingBag className="h-5 w-5" />
                {totalItems > 0 && (
                  <Badge variant="destructive" className="absolute -right-2 -top-2 h-5 w-5 justify-center p-0">{totalItems}</Badge>
                )}
                <span className="sr-only">Shopping Bag</span>
              </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
