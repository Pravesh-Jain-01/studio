
'use client';

import { useCart } from '@/context/cart-context';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, ShoppingBag } from 'lucide-react';

/**
 * CartPage displays the contents of the user's shopping cart.
 * It allows users to view items, update quantities, remove items, and proceed to checkout.
 * The component uses the `useCart` hook to interact with the global cart state.
 * @returns {JSX.Element} The shopping cart page UI.
 */
export default function CartPage() {
  const { cart, removeFromCart, updateQuantity } = useCart();

  // Calculate the subtotal of all items in the cart.
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="container py-12 md:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Your Bag</h1>
        <p className="mt-4 text-muted-foreground md:text-lg">
          Check your items before you checkout.
        </p>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-muted rounded-lg flex flex-col items-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Your Bag is Empty</h2>
          <p className="text-muted-foreground mb-6">Looks like you haven't added anything yet.</p>
          <Button asChild>
            <Link href="/shop">Start Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8 xl:gap-12 items-start">
          <div className="lg:col-span-2 bg-secondary/50 rounded-lg p-4 sm:p-6 space-y-6">
            {cart.map((item) => {
              return (
                <div key={item.variantId} className="flex gap-4">
                  <div className="w-24 h-28 flex-shrink-0 relative rounded-md overflow-hidden bg-secondary">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.quote}
                        fill
                        className="object-cover"
                        data-ai-hint="product photo"
                      />
                    )}
                  </div>
                  <div className="flex-grow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-grow">
                        <Link href={`/product/${item.productId}`}>
                            <h3 className="font-semibold hover:text-primary transition-colors leading-tight">{item.quote}</h3>
                        </Link>
                        <p className="text-sm text-muted-foreground capitalize">
                            {item.color} / {item.fit} / {item.size.toUpperCase()}
                        </p>
                        <p className="font-bold mt-1 sm:hidden">₹{item.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                                updateQuantity(item.variantId, parseInt(e.target.value))
                            }
                            className="w-16 h-10 text-center"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.variantId)}
                            className="text-muted-foreground"
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove item</span>
                        </Button>
                    </div>
                     <div className="w-20 text-right font-semibold hidden sm:block">
                        ₹{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-1 bg-secondary rounded-lg p-6 space-y-6 sticky top-24">
            <h2 className="text-2xl font-bold">Order Summary</h2>
            <div className="space-y-2">
                 <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="font-medium">Free</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-border pt-4 mt-4">
                    <span>Total</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                </div>
            </div>
            <Button asChild size="lg" className="w-full font-bold text-lg">
              <Link href="/checkout">Proceed to Checkout</Link>
            </Button>
            <p className="text-xs text-center text-muted-foreground">
                Shipping & taxes calculated at checkout.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
