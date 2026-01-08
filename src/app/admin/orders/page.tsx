'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  useUser,
} from '@/firebase';
import { collectionGroup, query as firestoreQuery, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';

export default function AdminOrdersPage() {
  const firestore = useFirestore();
  const { user: adminUser } = useUser();

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Query all 'orders' subcollections and order them by creation date
    return firestoreQuery(collectionGroup(firestore, 'orders'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: allOrders, isLoading } = useCollection(ordersQuery);
  
  // Filter out orders placed by the admin user
  const customerOrders = allOrders?.filter(order => order.userId !== 'FntP4YeFuGdDAEyvTx47sX9KHYu2');

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
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Orders</h1>
          <p className="mt-1 text-muted-foreground">
            View and manage all orders from your customers.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            A list of all orders placed in your store.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Loading orders...
                  </TableCell>
                </TableRow>
              ) : customerOrders && customerOrders.length > 0 ? (
                customerOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      {order.createdAt?.toDate ? format(order.createdAt.toDate(), 'PPP') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {order.shippingDetails?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(order.status)} className="capitalize">
                        {order.status}
                      </Badge>
                    </TableCell>
                     <TableCell>
                      {order.items?.length || 0}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{order.total?.toFixed(2) || '0.00'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No customer orders found yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
