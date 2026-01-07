'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AdminOrdersPage() {
  const firestore = useFirestore();

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // This query fetches all documents from any subcollection named 'orders'
    return query(
      collectionGroup(firestore, 'orders'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  const { data: orders, isLoading } = useCollection(ordersQuery);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'placed': return 'default';
      case 'shipped': return 'secondary';
      case 'delivered': return 'outline';
      default: return 'destructive';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Orders</CardTitle>
        <CardDescription>
          Here's a list of all orders from your store.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Order ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading orders...
                </TableCell>
              </TableRow>
            ) : orders && orders.length > 0 ? (
              orders.map((order: any) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.shippingDetails?.name || 'N/A'}
                    <p className="text-xs text-muted-foreground">{order.shippingDetails?.phone}</p>
                  </TableCell>
                  <TableCell>
                    {order.createdAt
                      ? format(order.createdAt.toDate(), 'dd MMM, yyyy')
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status)} className="capitalize">
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ₹{order.total?.toFixed(2) || '0.00'}
                  </TableCell>
                   <TableCell>{order.items?.length || 0}</TableCell>
                   <TableCell className="font-mono text-xs">{order.id}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
