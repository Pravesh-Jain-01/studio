
'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { Suspense } from 'react';

/**
 * ConfirmationContent displays the main content of the order confirmation page.
 * It retrieves the order ID from the URL search parameters to display it to the user.
 * @returns {JSX.Element} The content of the confirmation message.
 */
function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="container max-w-2xl mx-auto py-16 md:py-24">
      <div className="bg-secondary p-8 rounded-lg text-center flex flex-col items-center">
        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Thank you for your order!
        </h1>
        <p className="mt-4 text-muted-foreground md:text-lg">
          Your feelings have been confirmed and are being prepared.
        </p>
        {orderId && (
          <div className="mt-6 text-sm text-muted-foreground bg-background/50 px-4 py-2 rounded-md">
            Your order ID is: <span className="font-mono text-foreground">{orderId}</span>
          </div>
        )}
        <Button asChild className="mt-8">
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}


/**
 * OrderConfirmationPage is the page shown to the user after a successful checkout.
 * It uses React Suspense to handle the loading of URL search parameters.
 * @returns {JSX.Element} The order confirmation page UI.
 */
export default function OrderConfirmationPage() {
    return (
        <Suspense fallback={<div className="container py-12 text-center">Loading confirmation...</div>}>
            <ConfirmationContent />
        </Suspense>
    )
}
