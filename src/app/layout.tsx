
'use client';

import './globals.css';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { CartProvider } from '@/context/cart-context';
import { usePathname } from 'next/navigation';

/**
 * RootLayout is the main layout component for the application.
 * It wraps all pages with essential providers like Firebase, Cart, and Toaster notifications.
 * It also conditionally renders the site header and footer based on the current route.
 * @param {{ children: React.ReactNode }} props - The props for the component.
 * @param {React.ReactNode} props.children - The page content to be rendered within the layout.
 * @returns {JSX.Element} The root layout of the application.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  // Check if the current page is part of the admin section to conditionally hide header/footer.
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <title>Podium Wear | Engineered for Victory</title>
        <meta name="description" content="Podium Wear: High-performance athletic apparel designed for champions. Wear your victory." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Oswald:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col bg-background">
        <FirebaseClientProvider>
          <CartProvider>
            {!isAdminPage && <SiteHeader />}
            <main className="flex-grow">{children}</main>
            {!isAdminPage && <SiteFooter />}
            <Toaster />
          </CartProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
