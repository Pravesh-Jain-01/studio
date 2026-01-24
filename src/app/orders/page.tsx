
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ListOrdered, XCircle, Truck } from 'lucide-react';
import Image from 'next/image';
import { CartItem, QikinkOrder } from '@/lib/types';
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
import { useState, useEffect, useMemo } from 'react';
import { getQikinkOrders } from '../admin/actions';

type MergedOrder = {
  id: string;
  createdAt: any;
  total: number;
  items: CartItem[];
  qikinkOrderId: string;
  qikinkStatus: string;
  trackingLink: string | null;
  awb: string | null;
};

function OrderCard({ order }: { order: MergedOrder }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'live':
      case 'to be printed':
      case 'shipped':
        return 'default';
      case 'delivered':
      case 'archived':
        return 'outline';
      case 'cancelled':
      case 'on-hold':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const handleCancelOrder = () => {
    if (!user || !firestore) return;
    const orderDocRef = doc(firestore, 'users', user.uid, 'orders', order.id);
    cancelOrderNonBlocking(orderDocRef, { status: 'cancelled' });
    toast({
      title: "Order Cancellation Requested",
      description: `We are processing the cancellation for order #${order.id.slice(0,6)}.`,
    });
  }

  const isCancelable = order.qikinkStatus.toLowerCase() === 'live' || order.qikinkStatus.toLowerCase() === 'on-hold';

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
             <Badge variant={getStatusVariant(order.qikinkStatus)} className="capitalize text-sm">{order.qikinkStatus}</Badge>
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
                        </div>
                        <div className="flex-grow">
                            <p className="font-semibold">{item.quote}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                                {item.color} / {item.fit} / {item.size.toUpperCase()} &bull; Qty: {item.quantity}
                            </p>
                        </div>
                        <div className="font-semibold text-sm">
                            ₹{(item.price * item.quantity).toFixed(2)}
                        </div>
                    </div>
                )
            })}
        </div>
         
         <div className="border-t border-border pt-4 mt-4 flex justify-end gap-2">
            {order.trackingLink && (
                 <Button variant="outline" size="sm" asChild>
                    <a href={order.trackingLink} target="_blank" rel="noopener noreferrer">
                        <Truck className="mr-2 h-4 w-4" /> Track Order
                    </a>
                </Button>
            )}
            {isCancelable && (
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
                        This action cannot be undone. We will attempt to cancel your order with our fulfillment partner.
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
            )}
        </div>
    </div>
  )
}

export default function OrdersPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [qikinkOrders, setQikinkOrders] = useState<QikinkOrder[]>([]);
  const [isLoadingQikink, setIsLoadingQikink] = useState(true);

  const ordersQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'orders'), orderBy('createdAt', 'desc'));
  }, [user, firestore]);

  const { data: firestoreOrders, isLoading: areOrdersLoading } = useCollection(ordersQuery);

  useEffect(() => {
    const fetchQikinkData = async () => {
        if (!user) {
            setIsLoadingQikink(false);
            return;
        };
        setIsLoadingQikink(true);
        const result = await getQikinkOrders();
        if (result.success && result.orders) {
            setQikinkOrders(result.orders);
        } else {
            toast({
                variant: 'destructive',
                title: 'Could not sync order statuses',
                description: result.error || 'Failed to get latest updates from our fulfillment partner.',
            });
        }
        setIsLoadingQikink(false);
    };
    fetchQikinkData();
  }, [user, toast]);
  
  const mergedOrders = useMemo((): MergedOrder[] => {
      if (!firestoreOrders) return [];
      
      const ordersWithStatus = firestoreOrders.map(fsOrder => {
          const qkOrder = qikinkOrders.find(qk => String(qk.order_id) === fsOrder.qikinkOrderId);

          return {
              ...fsOrder,
              qikinkStatus: qkOrder?.status || fsOrder.status,
              trackingLink: qkOrder?.shipping.tracking_link || null,
              awb: qkOrder?.shipping.awb || null,
          };
      });
      return ordersWithStatus;
  }, [firestoreOrders, qikinkOrders]);


  if (isUserLoading || areOrdersLoading || isLoadingQikink) {
    return <div className="container py-12 text-center">Syncing your order history...</div>;
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
      {mergedOrders && mergedOrders.length > 0 ? (
        <div className="max-w-4xl mx-auto space-y-6">
            {mergedOrders.map((order) => (
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
