'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ListOrdered } from 'lucide-react';
import Image from 'next/image';
import { placeholderImages } from '@/lib/placeholder-images.json';
import { CartItem } from '@/context/cart-context';

function OrderCard({ order }: { order: any }) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'placed':
        return 'default';
      case 'shipped':
        return 'secondary';
      case 'delivered':
        return 'outline';
      default:
        return 'destructive';
    }
  };

  return (
    <div className="bg-secondary/50 rounded-lg p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-mono text-sm">{order.id}</p>
            </div>
            <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-semibold">{format(order.createdAt.toDate(), 'PPP')}</p>
            </div>
            <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-bold text-lg">₹{order.total.toFixed(2)}</p>
            </div>
             <Badge variant={getStatusVariant(order.status)} className="capitalize text-sm">{order.status}</Badge>
        </div>

        <div className="border-t border-border pt-4 mt-4 space-y-4">
            <h4 className="font-semibold">Items</h4>
            {order.items.map((item: CartItem) => {
                 const productImage = placeholderImages.find(p => p.id === item.imageId);
                 return (
                    <div key={item.variantId} className="flex gap-4 items-center">
                        <div className="w-16 h-20 relative rounded-md overflow-hidden bg-secondary border">
                        {productImage && (
                            <Image
                                src={productImage.imageUrl}
                                alt={item.quote}
                                fill
                                className="object-cover"
                            />
                        )}
                        <div className="absolute -right-2 -top-2 bg-primary text-primary-foreground h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold">{item.quantity}</div>
                        </div>
                        <div className="flex-grow">
                            <p className="font-semibold">{item.quote}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                                {item.color} / {item.fit} / {item.size.toUpperCase()}
                            </p>
                        </div>
                        <div className="font-semibold text-sm">
                            ₹{item.price * item.quantity}
                        </div>
                    </div>
                )
            })}
        </div>
    </div>
  )
}

export default function OrdersPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const ordersQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'orders'), orderBy('createdAt', 'desc'));
  }, [user, firestore]);

  const { data: orders, isLoading: areOrdersLoading } = useCollection(ordersQuery);

  if (isUserLoading || areOrdersLoading) {
    return <div className="container py-12 text-center">Loading your order history...</div>;
  }

  if (!user) {
    return (
      <div className="container py-12 text-center">
        <p>Please <Link href="/login" className="underline font-semibold">log in</Link> to view your orders.</p>
      </div>
    );
  }

  return (
    <div className="container py-12 md:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          My Orders
        </h1>
        <p className="mt-4 text-muted-foreground md:text-lg">
          A history of your feelings and purchases.
        </p>
      </div>
      {orders && orders.length > 0 ? (
        <div className="max-w-4xl mx-auto space-y-6">
            {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
            ))}
        </div>
      ) : (
         <div className="text-center py-24 border-2 border-dashed border-muted rounded-lg flex flex-col items-center max-w-2xl mx-auto">
            <ListOrdered className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No orders yet</h2>
          <p className="text-muted-foreground mb-6">Looks like you haven't placed an order.</p>
          <Button asChild>
            <Link href="/shop">Start Shopping</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
