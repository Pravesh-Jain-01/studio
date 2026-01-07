import Link from "next/link";
import { Button } from "./ui/button";
import { ShoppingBag } from "lucide-react";

export function SiteHeader() {
  const navLinks = [
    { href: "/shop", label: "shop" },
    { href: "/collections/bas-ehsaas", label: "collections" },
    { href: "/about", label: "about" },
    { href: "/contact", label: "contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-6 flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl tracking-tighter font-headline">softsaath</span>
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
           <Button variant="ghost" size="icon">
             <ShoppingBag className="h-5 w-5" />
             <span className="sr-only">Shopping Bag</span>
           </Button>
        </div>
      </div>
    </header>
  );
}
