import { Instagram, Twitter, Facebook } from "lucide-react";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="w-full bg-secondary text-secondary-foreground">
      <div className="container py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <p className="text-lg font-bold font-headline">softsaath</p>
            <p className="text-sm text-muted-foreground mt-2">clothing for the soul.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:col-span-3">
              <div className="space-y-3">
                <h4 className="font-semibold uppercase tracking-wider text-sm">Shop</h4>
                 <ul className="space-y-2 text-sm">
                  <li><Link href="/shop" className="text-muted-foreground hover:text-primary">all products</Link></li>
                  <li><Link href="/collections/bas-ehsaas" className="text-muted-foreground hover:text-primary">drop 01</Link></li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold uppercase tracking-wider text-sm">about us</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/about" className="text-muted-foreground hover:text-primary">our story</Link></li>
                  <li><Link href="/contact" className="text-muted-foreground hover:text-primary">contact</Link></li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold uppercase tracking-wider text-sm">support</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/policies" className="text-muted-foreground hover:text-primary">policies</Link></li>
                  <li><Link href="/policies" className="text-muted-foreground hover:text-primary">shipping & returns</Link></li>
                </ul>
              </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()} softsaath. all rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-muted-foreground hover:text-primary">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="https://instagram.com/softsaath" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary">
              <Facebook className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
