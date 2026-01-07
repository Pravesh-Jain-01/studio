import { Instagram } from "lucide-react";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="w-full border-t bg-background">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-lg font-semibold">softsaath</p>
            <p className="text-sm text-muted-foreground">wear your feelings.</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/policies" className="hover:text-primary">policies</Link>
            <Link href="/contact" className="hover:text-primary">contact</Link>
            <a href="https://instagram.com/softsaath" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
              <Instagram className="h-5 w-5" />
            </a>
          </div>
        </div>
        <div className="mt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} softsaath. all rights reserved.
        </div>
      </div>
    </footer>
  );
}
