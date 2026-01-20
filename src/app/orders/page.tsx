
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ListOrdered, XCircle } from 'lucide-react';
import Image from 'next/image';
import { CartItem } from '@/context/cart-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { cancelOrderNonBlocking } from '@/firebase/non-blocking-updates';

function OrderCard({ order }: { order: any }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'placed':
        return 'default';
      case 'shipped':
        return 'secondary';
      case 'delivered':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'destructive';
    }
  };

  const handleCancelOrder = () => {
    if (!user || !firestore || order.status !== 'placed') return;

    const orderDocRef = doc(firestore, 'users', user.uid, 'orders', order.id);
    
    cancelOrderNonBlocking(orderDocRef, { status: 'cancelled' });

    toast({
      title: "Order Cancelled",
      description: `Your order #${order.id.slice(0,6)} has been cancelled.`,
    });
  }

  const isCancelable = order.status === 'placed';

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
                 return (
                    <div key={item.variantId} className="flex gap-4 items-center">
                        <div className="w-16 h-20 relative rounded-md overflow-hidden bg-secondary border">
                        {item.imageUrl && (
                            <Image
                                src={item.imageUrl}
                                alt={item.quote}
                                fill
                                className="object-cover"
                                data-ai-hint="product photo"
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
         {isCancelable && (
          <div className="border-t border-border pt-4 mt-4 flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Order
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. Your order will be permanently cancelled.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Go Back</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancelOrder} className="bg-destructive hover:bg-destructive/90">
                    Yes, Cancel Order
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
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
