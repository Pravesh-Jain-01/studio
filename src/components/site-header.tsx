import Link from "next/link";

export function SiteHeader() {
  const navLinks = [
    { href: "/shop", label: "shop" },
    { href: "/collections/bas-ehsaas", label: "collections" },
    { href: "/about", label: "about" },
    { href: "/contact", label: "contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-lg font-headline">softsaath</span>
          </Link>
        </div>
        <nav className="flex items-center space-x-6 text-sm font-medium ml-auto">
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
      </div>
    </header>
  );
}
