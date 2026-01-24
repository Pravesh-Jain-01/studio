import { Instagram, Twitter, Facebook } from "lucide-react";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="w-full bg-secondary text-secondary-foreground">
      <div className="container py-12 md:py-16">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="sm:col-span-2 md:col-span-1">
            <p className="text-lg font-bold font-headline">Podium Wear</p>
            <p className="text-sm text-muted-foreground mt-2">Engineered for Victory.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:col-span-3">
              <div className="space-y-3">
                <h4 className="font-semibold uppercase tracking-wider text-sm">Shop</h4>
                 <ul className="space-y-2 text-sm">
                  <li><Link href="/shop" className="text-muted-foreground hover:text-primary">All Products</Link></li>
                  <li><Link href="/collections/legends-collection" className="text-muted-foreground hover:text-primary">Legends Collection</Link></li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold uppercase tracking-wider text-sm">About Us</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/about" className="text-muted-foreground hover:text-primary">Our Mission</Link></li>
                  <li><Link href="/contact" className="text-muted-foreground hover:text-primary">Contact</Link></li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold uppercase tracking-wider text-sm">Support</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/policies" className="text-muted-foreground hover:text-primary">Policies</Link></li>
                  <li><Link href="/policies" className="text-muted-foreground hover:text-primary">Shipping & Returns</Link></li>
                </ul>
              </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()} Podium Wear. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-muted-foreground hover:text-primary">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
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
