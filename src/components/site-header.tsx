
'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { ShoppingBag, LogOut, User as UserIcon, ListOrdered, Shield, Menu } from 'lucide-react';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

const navLinks = [
    { href: '/shop', label: 'Shop' },
    { href: '/collections/bas-ehsaas', label: 'Collections' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

function MainNav() {
    const pathname = usePathname();
    return (
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navLinks.map((link) => (
            <Link
                key={link.href}
                href={link.href}
                className={cn(
                    "transition-colors hover:text-foreground/80",
                    pathname?.startsWith(link.href) ? "text-foreground" : "text-foreground/60"
                )}
            >
                {link.label}
            </Link>
            ))}
        </nav>
    );
}

function MobileNav() {
    const [open, setOpen] = useState(false);
     const pathname = usePathname();

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left">
                <SheetHeader className="sr-only">
                    <SheetTitle>Main Menu</SheetTitle>
                    <SheetDescription>Navigation links for SoftSaath.</SheetDescription>
                </SheetHeader>
                <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
                    <span className="font-bold text-xl tracking-tighter font-headline">SoftSaath</span>
                </Link>
                <div className="mt-8 flex flex-col space-y-4">
                    {navLinks.map((link) => (
                         <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                                "text-lg font-medium transition-colors hover:text-foreground/80",
                                pathname?.startsWith(link.href) ? "text-foreground" : "text-muted-foreground"
                            )}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    );
}

function AuthNav({ hasMounted }: { hasMounted: boolean }) {
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const { cart } = useCart();

    const handleLogout = () => {
        auth.signOut();
    };

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const isAdmin = user?.email === ADMIN_EMAIL;

    if (!hasMounted) {
        return <div className="h-9 w-28" />; // Placeholder for server render
    }
    
    return (
        <div className="flex items-center space-x-1 md:space-x-2">
            {!isUserLoading && (
                user ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <UserIcon className="h-5 w-5" />
                                <span className="sr-only">User Menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {isAdmin && (
                                <DropdownMenuItem asChild>
                                <Link href="/admin"><Shield className="mr-2 h-4 w-4" />Admin</Link>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild>
                                <Link href="/profile"><UserIcon className="mr-2 h-4 w-4" />Profile</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/orders"><ListOrdered className="mr-2 h-4 w-4" />My Orders</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />Log Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <div className="hidden md:flex items-center gap-1">
                        <Button asChild variant="ghost" size="sm">
                        <Link href="/login">Log In</Link>
                        </Button>
                        <Button asChild size="sm">
                        <Link href="/register">Register</Link>
                        </Button>
                    </div>
                )
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
    );
}

export function SiteHeader() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 md:mr-6 flex items-center">
            <MobileNav />
             <Link href="/" className="hidden md:flex items-center space-x-2">
                <span className="font-bold text-xl tracking-tighter font-headline">
                    SoftSaath
                </span>
            </Link>
        </div>

        <div className="flex flex-1 items-center justify-between">
            <MainNav />
             <div className="flex flex-1 items-center justify-end">
                <AuthNav hasMounted={hasMounted} />
            </div>
        </div>
      </div>
    </header>
  );
}
